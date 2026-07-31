---
title: "Demystifying LLMs (Part 2 of 4): How AI Reads (Byte Pair Encoding)"
description: "Language models don't see words the way humans do. In Part 2, we build a Byte Pair Encoding (BPE) Tokenizer in Kotlin to understand how AI parses language."
pubDate: "2026-07-14"
tags: ["AI SDLC", "Kotlin", "Architecture", "LLMs"]
draft: false
---

In [**Part 1** of this series](/mobile-infra-blog/llms-from-scratch-part-1-neural-nets/), we explored how Neural Networks learn using Weights, Biases, and Backpropagation. But neural networks are fundamentally mathematical engines—they perform matrix multiplication on arrays of numbers. They do not understand English. They cannot read a string like `"The cat sat on the mat"`. 

Before an LLM can predict the next word, it has to convert your text into numbers. This process is called **Tokenization**.

## What is a Token?

A model breaks your prompt into pieces called "Tokens." A token is not necessarily a full word, nor is it a single character. It is something in between. 

For example:
* The word `the` might be 1 token.
* The word `tokenization` might be split into 2 tokens: `token` and `ization`.
* A space or a new line is a token.
* A single complex Emoji might be multiple tokens.

How does the AI decide where to split a word? It doesn't use hardcoded English grammar rules. Instead, it uses a purely statistical algorithm called **Byte Pair Encoding (BPE)**.

## The BPE Algorithm

BPE was invented in 1994 as a data compression technique. 21 years later, AI researchers realized this algorithm was absolutely perfect for building vocabularies for neural networks.

The idea is elegantly simple:
1. Start by splitting all your training text into individual characters.
2. Find the adjacent pair of characters that appears most frequently.
3. Merge them into a single new token.
4. Repeat this process thousands of times.

If a fragment like "er" is frequently used together, your BPE Tokenizer ensures they are treated as one solid concept. If they aren't, it splits them up. 



Because it is purely statistical, one algorithm can handle English, Japanese, Kotlin code, and emojis without *any* language-specific rules. Common words like `the` get merged into a single token because they appear constantly. Rare words get left as fractured sub-word pieces.

### Building a Tokenizer in Kotlin

To visualize this, let's write a miniature BPE algorithm in Kotlin. 

In real life, you would feed the tokenizer gigabytes of text (like all of Wikipedia). To keep our code simple, we will start with a tiny pre-counted "Vocabulary" of just 5 words. We have already counted how many times each word appeared in our imaginary dataset (its **Frequency**). 

Here is the exact dataset we are feeding into our algorithm:
* `low`: 5
* `lowest`: 2
* `newer`: 6
* `wider`: 3
* `new`: 2

We start by splitting every word into individual characters with spaces between them. You will notice in the code below that we also append a special `</w>` (End of Word) symbol to each word. This is a critical trick in LLMs because it helps the AI distinguish between a suffix at the end of a word (like the `er` in "new**er**") versus a fragment in the middle of a word (like the `er` in "**er**ror"). 

Let's run our BPE merging loop to statistically find and merge the most common character pairs!

<textarea class="kotlin-code" theme="darcula" style="display:none;">
fun getStats(vocab: Map<String, Int>): Map<Pair<String, String>, Int> {
    val pairs = mutableMapOf<Pair<String, String>, Int>()
    
    for ((word, frequency) in vocab) {
        val symbols = word.split(" ")
        // Look at every adjacent pair of symbols in the word
        for (i in 0 until symbols.size - 1) {
            val pair = Pair(symbols[i], symbols[i + 1])
            pairs[pair] = pairs.getOrDefault(pair, 0) + frequency
        }
    }
    return pairs
}

fun mergeVocab(
    pairToMerge: Pair<String, String>, 
    vocab: Map<String, Int>
): Map<String, Int> {
    val newVocab = mutableMapOf<String, Int>()
    // A Regex to safely replace the specific pair of characters
    val regex = Regex("(?<!\\S)${Regex.escape(pairToMerge.first)} ${Regex.escape(pairToMerge.second)}(?!\\S)")
    val replacement = "${pairToMerge.first}${pairToMerge.second}"

    for ((word, freq) in vocab) {
        val newWord = regex.replace(word, replacement)
        newVocab[newWord] = freq
    }
    return newVocab
}

fun printVocab(title: String, vocab: Map<String, Int>) {
    println("--- $title ---")
    vocab.entries.sortedByDescending { it.value }.forEach {
        println("Freq ${it.value}: [ ${it.key} ]")
    }
    println()
}

fun main() {
    // 1. Initial vocabulary: spaces between all characters to represent unmerged state.
    // The frequency represents how many times the word appeared in our training data.
    var vocab = mapOf(
        "l o w </w>" to 5,
        "l o w e s t </w>" to 2,
        "n e w e r </w>" to 6,
        "w i d e r </w>" to 3,
        "n e w </w>" to 2
    )

    printVocab("Initial State", vocab)

    // Let's run 5 iterations of BPE merging
    val numMerges = 5
    for (i in 1..numMerges) {
        val pairs = getStats(vocab)
        if (pairs.isEmpty()) break
        
        // Find the most frequently occurring pair
        val bestEntry = pairs.maxByOrNull { it.value } ?: break
        val bestPair = bestEntry.key
        
        println(">> Iteration $i:")
        println(">> Found most frequent pair: '${bestPair.first}' + '${bestPair.second}' (occurs ${bestEntry.value} times)")
        println(">> Merging into new token: '${bestPair.first}${bestPair.second}'\n")
        
        // Merge that pair in our vocabulary
        vocab = mergeVocab(bestPair, vocab)
        printVocab("State After Merge $i", vocab)
    }
}
</textarea>

If you run this code, you will see `e` and `r` merged into `er`. Then `e` and `w` merge into `ew`. Eventually, the common prefix `new` becomes its own solid token, while rare fragments remain separate.

When training a massive model like GPT-4, OpenAI runs this exact merging loop tens of thousands of times to build a "vocabulary" of roughly 100,000 unique pieces of text. 

### From Text to Numbers (Token IDs)

But wait, we still just have pieces of text! How does the model actually read them?

Once the BPE algorithm finishes building its vocabulary of 100,000 unique text fragments, it simply saves them into a massive array. **The Token ID is literally just the array index (row number) of that fragment!** 
* The standalone letter `e` might be saved at index `41` (Token ID 41).
* The merged chunk `er` might be saved at index `5012` (Token ID 5012).
* The full word `new` might be saved at index `1056` (Token ID 1056).

When you type a prompt into ChatGPT, the interface uses this vocabulary to slice your sentence into chunks, maps each chunk to its respective Token ID, and produces a simple array of integers (e.g., `[1056, 41, 5012]`). 

**That array of numbers is the actual input that gets fed into the Neural Network!**

> [!TIP]
> *Want to see this in action on real LLMs? Check out the official [OpenAI Tokenizer Tool](https://platform.openai.com/tokenizer) to see exactly how ChatGPT breaks down your English sentences into numeric tokens!*

## Why This Matters to Mobile Engineers

Tokenization isn't just a backend preprocessing detail. It has massive real-world consequences for how you integrate AI into mobile apps:

1. **Cost:** Every API call you make to Gemini or Claude is priced *per token*, not per word. If you send heavy, bloated JSON in your prompt, curly braces and tabs might tokenize poorly and cost you significantly more money.
2. **Context Limits:** Every model has a maximum Context Window (e.g., 128k tokens). If your prompt exceeds this, the LLM literally goes blind and truncates your history.

Now that we have parsed human language into a vocabulary of numeric Token IDs, how does the model actually understand what those numbers *mean*? 

In **Part 3**, we will dive into **Embeddings** and the beautiful vector mathematics of meaning.

***

## References & Further Reading
* Rico Sennrich, Barry Haddow, and Alexandra Birch (2015). *"Neural Machine Translation of Rare Words with Subword Units"*. [Link](https://arxiv.org/abs/1508.07909)
  * **Why read this?** This is the foundational paper that introduced Byte Pair Encoding (BPE) to Natural Language Processing. If you want to see the original mathematical theory that inspired the Tokenizer loop we built above, this is the paper to read!

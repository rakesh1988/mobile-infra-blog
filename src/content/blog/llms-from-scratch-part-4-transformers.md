---
title: "Demystifying LLMs (Part 4 of 4): Attention and The Transformer Engine"
description: "The grand finale. How do words dynamically change their meaning based on context? We explore the Google paper that changed the world and write a Self-Attention loop in Kotlin."
pubDate: "2026-07-28"
tags: ["AI SDLC", "Kotlin", "Architecture", "LLMs"]
draft: false
---

In [**Part 3** of this series](/mobile-infra-blog/llms-from-scratch-part-3-embeddings/), we learned that an LLM understands the meaning of a word by representing it as a massive array of numbers called an **Embedding**. We saw how GPT-4 uses an array of 12,288 numbers to mathematically plot every single word on a graph based on thousands of invisible "vibes".

> **Goal of this post:** By the end of this grand finale, we will tie together everything we learned in Parts 1, 2, and 3. We will explore how words dynamically change their mathematical meaning based on context, and we will finally build the complete, end-to-end pipeline that powers ChatGPT to predict the next word!

But this creates a massive, glaring problem. 

If the word **"Apple"** only has one static array of 12,288 numbers, what happens when the model tries to predict the next word in these two sentences?
1. *"I ate a delicious Apple ___"*
2. *"I bought Apple ___"*

If the numbers are static and frozen, the mathematical model cannot tell the difference between the fruit and the trillion-dollar tech company! It just plots them in the exact same spot on the graph. For decades, this limitation held AI back. 

To solve this, we needed a way for words to dynamically change their math based on the context of the sentence.

## "Attention Is All You Need"

In 2017, a team of researchers at Google published a paper that would literally change the course of human history: *"Attention Is All You Need"*. 

They introduced a brand new neural network architecture called the **Transformer**. The secret sauce of the Transformer was a mechanism called **Self-Attention**. 

Self-Attention allows the word "Apple" to literally "look around" at the other words in the sentence and dynamically recalculate its 12,288 numbers on the fly! When it sees the word "ate", its numbers physically shift towards "Fruit". When it sees the word "stock", its numbers physically shift towards "Finance".

But how do words look at each other?

## The Cocktail Party Analogy

Imagine you are at a loud, crowded cocktail party. There are hundreds of conversations happening simultaneously. How do you manage to hold a conversation? 

You *pay attention* to the specific person talking to you, and you completely tune out the rest of the noise. 

The Transformer does exactly this using three matrices called **Query**, **Key**, and **Value**. In the Transformer, every word acts like a person at the party.

* **Query (What I want):** The word "Apple" projects a Query vector that essentially shouts: *"I am the word 'Apple'. I need to know if I am a fruit or a company. Who around here has food or finance vibes?"*
* **Key (What I have):** The other words in the sentence hold up their Key vectors. The word "ate" says: *"I am a food-related verb!"* The word "delicious" says: *"I am a food-related adjective!"*
* **Value (Who I am):** This is the underlying mathematical substance of the word. 

The network calculates a mathematical **Attention Score** by comparing the Query of "Apple" against the Keys of all the other words. Because the Query for "Apple" strongly matches the Key for "ate", they generate a massive Attention Score! 

"Apple" then takes the **Value** of "ate", multiplies it by that massive Attention Score, and adds it to its own embedding! 

Through this beautiful mathematical mixing process, the word "Apple" has dynamically absorbed the context of its surroundings. It is no longer just the generic dictionary definition of Apple; it is now a highly specific, context-aware mathematical representation of *a fruit being eaten*.

> [!NOTE]
> **Wait, does this require 10,000 GPUs again?**
> No! Think of it like a dictionary. 
> 
> **Training (What we discussed in [Part 3](/mobile-infra-blog/llms-from-scratch-part-3-embeddings/)):** This is the process of *writing* the dictionary. Reading the entire internet and nudging those 12,288 numbers for every word takes months on massive GPU clusters. 
> 
> **Inference (Self-Attention):** This is the process of *reading* the dictionary. When you type a prompt into ChatGPT, the dictionary is already finished. There is only *one* frozen entry for the word "Apple" (a perfectly neutral `0.50`). But during Inference, Self-Attention pulls out that frozen number and dynamically mixes it with the numbers of the surrounding words! If it's next to "ate", the math temporarily shifts "Apple" to `0.85` (Food). If it's next to "stock", the math temporarily shifts it to `-0.85` (Finance). A single server (or even a phone) can do this quick mixing instantly!

## The Code: Self-Attention in Kotlin

Let's write a highly simplified version of this Self-Attention loop in Kotlin. 

We will feed it a sentence, assign some basic arrays to act as our words, and watch as "Apple" calculates its Attention Scores and dynamically updates its own meaning!

<textarea class="kotlin-code" theme="darcula" style="display:none;">
import kotlin.math.exp

fun main() {
    // 1. The input sentence
    val sentence = listOf("I", "ate", "a", "delicious", "Apple")
    
    // 2. Simplified Embeddings (Values) for our words
    // We are using 1D arrays for simplicity
    val values = mapOf(
        "I"         to 0.1,
        "ate"       to 0.9,  // High "Food" vibe
        "a"         to 0.0,
        "delicious" to 0.8,  // High "Food" vibe
        "Apple"     to 0.5   // Neutral, could be fruit or company
    )
    
    // 3. Let's pretend the network calculated these Attention Scores for "Apple" 
    // against the other words in the sentence (based on Query/Key matching)
    val rawAttentionScores = mapOf(
        "I"         to -2.0, // Low attention
        "ate"       to 4.0,  // High attention!
        "a"         to -3.0, // Low attention
        "delicious" to 3.5,  // High attention!
        "Apple"     to 1.0   // Self attention
    )
    
    println("--- CALCULATING ATTENTION FOR 'Apple' ---\n")
    
    // 4. Softmax Function
    // We must convert the raw scores into percentages that add up to 100% (1.0)
    var sumExp = 0.0
    for (score in rawAttentionScores.values) { sumExp += exp(score) }
    
    val attentionWeights = mutableMapOf<String, Double>()
    for ((word, score) in rawAttentionScores) {
        val weight = exp(score) / sumExp
        attentionWeights[word] = weight
        println("Attention paid to '$word': ${String.format("%.1f", weight * 100)}%")
    }
    
    println("\n--- UPDATING THE EMBEDDING ---")
    
    // 5. Update the "Apple" embedding by mixing in the Values of the other words 
    // based on how much attention we paid to them!
    var updatedApple = 0.0
    for (word in sentence) {
        val weight = attentionWeights[word]!!
        val value = values[word]!!
        updatedApple += (weight * value)
    }
    
    println("Original 'Apple' Embedding: 0.50")
    println("Updated Context-Aware 'Apple' Embedding: ${String.format("%.2f", updatedApple)}")
}
</textarea>

Hit the Run button! 

Notice how the Softmax function forced "Apple" to allocate 60.3% of its attention to "ate", and 36.5% to "delicious", whilst almost entirely ignoring "I" and "a". 

> [!NOTE]
> **Why is it called Softmax?** 
> If we used a "Hard Max" function, the highest score would instantly get `100%` of the attention, and everything else would get `0%`. That destroys all nuance! "[Soft Max](https://en.wikipedia.org/wiki/Softmax_function)" softens this approach. It creates a probability distribution where the biggest number gets the most attention, but runner-ups still get a fair share, and the total always perfectly adds up to 100%.

By multiplying the Values of those words by those massive attention percentages, the embedding for "Apple" was pulled from a neutral `0.50` all the way up to `0.85`! The math dynamically shifted it into a "Food" vector!

## The Final Output (Predicting the Next Word)

So, what happens after all of this? 

Once the embedding for "Apple" has been dynamically updated via Self-Attention, it is passed through a standard **Feed-Forward Neural Network** (exactly like the one we built in [Part 1](/mobile-infra-blog/llms-from-scratch-part-1-neural-nets/)!). This allows the model to "think" and process the new context. 

This process (Self-Attention followed by a Feed-Forward Neural Network) repeats dozens of times across multiple layers inside the Transformer. 

Finally, the Transformer takes the very last updated embedding in the sequence and pushes it through one final **Softmax** layer. This layer multiplies the final 12,288-dimensional embedding against our entire 50,000-word Tokenizer vocabulary from [Part 2](/mobile-infra-blog/llms-from-scratch-part-2-tokenization/). 

It calculates a final percentage score for every single word in the English language:
*   `pie`: **82.0%**
*   `juice`: **15.0%**
*   `tree`: **2.9%**
*   `iPhone`: **0.0001%** *(Because our Attention mechanism shifted "Apple" toward food, tech words are mathematically destroyed!)*

The model spits out the highest-scoring word: `"pie"`. 

## The Autoregressive Loop (Writing a Story)

You might be wondering: *If the model just predicts the next word, how does ChatGPT write a 5-page story?*

It uses something called an **Autoregressive Loop**. 
Once the model predicts `"pie"`, it doesn't stop. It takes that word, glues it to the end of your original sentence, and feeds the *entire* new string back into the Transformer from the very beginning.

1. *"I ate a delicious Apple ___"* ➡️ Predicts **pie**
2. *"I ate a delicious Apple pie ___"* ➡️ Predicts **and**
3. *"I ate a delicious Apple pie and ___"* ➡️ Predicts **it**
4. *"I ate a delicious Apple pie and it ___"* ➡️ Predicts **was**

It just plays "fill in the blank" over and over again, thousands of times in a row, at lightning speed. It generates essays, code, and poetry exactly one token at a time.

**And that is how ChatGPT works.** 

From raw text, to integer IDs, to invisible geometric vibes, to dynamically shifting context, to the final probabilistic prediction. You now understand the full pipeline of a Large Language Model from scratch!

***

## References & Further Reading
* Ashish Vaswani, et al. (2017). *"Attention Is All You Need"*. (The paper that invented the Transformer). [Link](https://arxiv.org/abs/1706.03762)
* **Why read this?** This is widely considered the most important AI paper of the 21st century. While the math is dense, the architectural diagram on page 3 is iconic. Every mobile engineer should glance at it at least once.

---
title: "Demystifying LLMs Part 1: From If-Statements to Neural Networks"
description: "How did we get from simple chatbots to ChatGPT? Part 1 of our series breaks down the illusion of rule-based systems and introduces the foundations of Neural Networks using Kotlin."
pubDate: "2026-07-07"
tags: ["AI SDLC", "Kotlin", "Architecture", "LLMs"]
draft: false
---

We are increasingly interacting with AI services like Claude, Gemini, and ChatGPT on a daily basis. Most engineers hand-wave over how they work, summarizing them as just "next token predictors." While that is true, there is a massive amount of elegant machinery involved before an LLM can even guess what token comes next.

In this four-part series, we are going to demystify how Large Language Models work from scratch, translating 70 years of AI research into **Kotlin** code designed specifically for Mobile Engineers.

We start at the beginning: the illusion of intelligence.

## The Illusion of Intelligence: Eliza

Before LLMs existed, we had rule-based chatbots. The most famous early example was **ELIZA**, built in 1966 at MIT by Joseph Weizenbaum. ELIZA was programmed to mimic a Rogerian psychotherapist.

If you are a fan of the show *Young Sheldon*, you might remember the episode where Sheldon discovers ELIZA and becomes obsessed with it, treating it like a real confidant. This actually happened in real life! Weizenbaum’s own secretary asked him to leave the room so she could speak privately with the machine. 

But ELIZA had zero understanding. It was essentially a massive collection of pattern-matching rules. In Kotlin, ELIZA looks something like this:

<div class="kotlin-code" theme="darcula">
fun main() {
    println(elizaRespond("I feel happy today"))
    println(elizaRespond("My boss is annoying"))
    println(elizaRespond("I just learned about AI"))
}

fun elizaRespond(input: String): String {
    val normalized = input.lowercase()
    
    return when {
        normalized.startsWith("i feel") -> {
            val feeling = normalized.removePrefix("i feel").trim()
            "Why do you feel $feeling?"
        }
        normalized.contains("my boss") -> "Tell me more about your boss."
        normalized.contains("mother") -> "How is your relationship with your mother?"
        else -> "Please go on. How does that make you feel?"
    }
}
</div>

If you type *"I feel happy today"*, the script blindly extracts *"happy today"* and spits out *"Why do you feel happy today?"* 

**Don't believe me? Try it yourself below!**

<div class="chat-container" style="border: 1px solid var(--color-border); border-radius: 8px; margin: 2rem 0; overflow: hidden; background: #1e1e1e; font-family: monospace;">
  <div class="chat-header" style="background: #333; padding: 0.75rem 1rem; color: #fff; border-bottom: 1px solid #444;">
    <strong>Terminal: ELIZA</strong>
  </div>
  <div id="chat-history" style="height: 250px; overflow-y: auto; padding: 1rem; color: #a9b7c6; display: flex; flex-direction: column; gap: 0.5rem;">
    <div style="color: #6a8759;">ELIZA: Hello. How can I help you today?</div>
  </div>
  <form id="chat-form" style="display: flex; border-top: 1px solid #444;">
    <input type="text" id="chat-input" placeholder="Type a message (try 'I feel...', 'my boss', 'mother')" style="flex: 1; padding: 0.75rem 1rem; border: none; background: #2b2b2b; color: #a9b7c6; outline: none;" autocomplete="off" />
    <button type="submit" style="padding: 0.75rem 1.5rem; background: #444; color: #fff; border: none; cursor: pointer; font-weight: bold;">Send</button>
  </form>
</div>

<script>
  document.getElementById('chat-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const inputEl = document.getElementById('chat-input');
    const historyEl = document.getElementById('chat-history');
    const message = inputEl.value.trim();
    if (!message) return;
    
    // Add User Message
    const userDiv = document.createElement('div');
    userDiv.style.color = '#cc7832';
    userDiv.textContent = `YOU: ${message}`;
    historyEl.appendChild(userDiv);
    
    inputEl.value = '';
    
    // ELIZA Logic
    const normalized = message.toLowerCase();
    
    const fallbacks = [
        "Please go on. How does that make you feel?",
        "Can you elaborate on that?",
        "I see. And what does that suggest to you?",
        "That is quite interesting.",
        "Tell me more about that."
    ];
    let response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    
    if (normalized.startsWith("i feel")) {
        const feeling = normalized.replace("i feel", "").trim();
        response = `Why do you feel ${feeling}?`;
    } else if (normalized.startsWith("i am") || normalized.startsWith("im ")) {
        const state = normalized.replace(/^(i am|im)\s+/, "").trim();
        response = `How long have you been ${state}?`;
    } else if (normalized.includes("my boss")) {
        response = "Tell me more about your boss.";
    } else if (normalized.includes("mother") || normalized.includes("mom")) {
        response = "How is your relationship with your mother?";
    } else if (normalized.includes("hello") || normalized.includes("hi")) {
        response = "Hello there. What is on your mind today?";
    }
    
    // Add ELIZA Message
    setTimeout(() => {
        const elizaDiv = document.createElement('div');
        elizaDiv.style.color = '#6a8759';
        elizaDiv.textContent = `ELIZA: ${response}`;
        historyEl.appendChild(elizaDiv);
        historyEl.scrollTop = historyEl.scrollHeight;
    }, 400); // Tiny delay to feel natural
  });
</script>

It’s an illusion. And like all illusions, it shatters the moment you push its boundaries. If you said something ELIZA didn't have a hardcoded rule for, it immediately fell back to generic responses like *"Please go on"*, and the illusion of intelligence instantly vanished. It went right back to being a dumb, rigid machine.

A human programmer had to sit down and manually author every single decision path in advance. The jump from ELIZA to ChatGPT is not just a "better chatbot"—it is a completely different architectural mechanism. We had to move from handwritten rules to machines that could learn patterns.

## Enter the Neural Network

To get past if-statements, we needed a mathematical model that could adjust itself. 

A neural network is a system of interconnected nodes (neurons) organized into layers. Data flows into the input layer, passes through hidden layers, and exits via the output layer. The magic lies in the connections. Each connection has a **Weight** (how much influence one neuron has on the next), and each node has a **Bias** (a baseline offset).

When we talk about a "Model" (like a 7-Billion parameter Llama model), we are literally just talking about a massive computer file containing billions of these exact Weight and Bias numbers. 

### What exactly is a Perceptron?

Before we look at code, let's look at a human example. A **Perceptron** is just the mathematical name for a single, artificial neuron. Its entire job is to weigh different factors to make a single decision. 

Imagine you are trying to decide whether to go to the beach. You have a few inputs:
1. Is the weather good? (Weight: High positive impact)
2. Is it the weekend? (Weight: Medium positive impact)
3. Do I have to work? (Weight: Massive negative impact)

You also have a **Bias**—maybe you naturally hate sand, so your baseline bias is negative. 

To make your decision, you multiply the inputs by their weights, add them all up, and add your bias. If the final score crosses a certain threshold, you go to the beach. If it doesn't, you stay home. 

A neural network is just millions of these tiny "decision makers" stacked on top of each other. 

### The Forward Pass in Kotlin

To understand how data flows through a neural network, let's write a simple `Perceptron` in Kotlin. This represents a single neuron doing a "forward pass"—calculating an output based on its inputs, weights, and bias.

<div class="kotlin-code" theme="darcula">
class Perceptron(
    private var weights: DoubleArray,
    private var bias: Double
) {
    // The Activation Function (Sigmoid) squashes the output between 0 and 1
    private fun sigmoid(x: Double): Double {
        return 1.0 / (1.0 + Math.exp(-x))
    }

    // The Forward Pass
    fun predict(inputs: DoubleArray): Double {
        require(inputs.size == weights.size) { "Inputs must match weights!" }
        
        // 1. Calculate the dot product of inputs and weights
        var sum = bias
        for (i in inputs.indices) {
            sum += inputs[i] * weights[i]
        }
        
        // 2. Pass through the activation function
        return sigmoid(sum)
    }
}

fun main() {
    // Our "Beach Decision" Neuron
    // Weights: [Weather (0.8), Weekend (0.5), Work (-0.9)]
    // Bias: Hates sand (-0.2)
    val beachNeuron = Perceptron(
        weights = doubleArrayOf(0.8, 0.5, -0.9), 
        bias = -0.2
    )
    
    // Scenario 1: Good weather (1.0), It's the weekend (1.0), No work (0.0)
    val scenario1 = beachNeuron.predict(doubleArrayOf(1.0, 1.0, 0.0))
    println("Scenario 1 Score: $scenario1") // Output > 0.5 (Yes, go to beach)
    
    // Scenario 2: Good weather (1.0), It's a weekday (0.0), I have to work (1.0)
    val scenario2 = beachNeuron.predict(doubleArrayOf(1.0, 0.0, 1.0))
    println("Scenario 2 Score: $scenario2") // Output < 0.5 (No, stay home)
}
</div>

Notice that the output isn't a hard `1.0` or `0.0`. Because of the activation function, it’s a decimal floating somewhere in between. Until you apply a strict threshold in your code (like `if (output > 0.5)`), the neuron's answer exists in a state of mathematical superposition—it is both True and False at the same time, much like Schrödinger's cat! 

This simple math—multiplying inputs by weights, adding a bias, and squashing the result—is the beating heart of AI. 

## The Breakthrough: Backpropagation

The perceptron above is hardcoded. The real breakthrough came in 1986 with an algorithm called **Backpropagation**. 

Instead of a human guessing the weights, you start with completely random weights. You feed data into the network, look at how wrong the prediction is (the Error or Loss), and then use calculus to propagate that error backward through the layers, nudging every single weight slightly closer to the correct answer. 

You repeat this process billions of times on supercomputers. When the training finishes, the resulting file containing those tuned weights *is* the LLM.

## What's Next?

Neural networks expect inputs to be numbers (`DoubleArray`), not English sentences. So how do we feed a prompt like *"Write a Python script"* into a neural network? 

In **Part 2**, we will explore how AI reads by building a **Byte Pair Encoding (BPE) Tokenizer** in Kotlin. 

***

## References & Further Reading
* Joseph Weizenbaum (1966). *"ELIZA—a computer program for the study of natural language communication between man and machine"*. [Link](https://dl.acm.org/doi/10.1145/365153.365168)
  * **Why read this?** This is the original paper detailing the exact pattern-matching rules and history behind the ELIZA psychotherapist program we recreated in the first section.
* Frank Rosenblatt (1958). *"The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain"*.
  * **Why read this?** This paper introduced the mathematical foundation of the artificial neuron. It's fascinating to see how closely our modern Kotlin code mirrors this 1958 concept!
* *Young Sheldon*, Season 1, Episode 12: *"A Computer, a Plastic Pony, and a Case of Beer"* (2018).
  * **Why watch this?** Because learning AI should be fun. This is the exact episode where Sheldon gets his first computer (a Tandy 1000) and becomes obsessed with the ELIZA chatbot, eventually realizing it's just a loop of rigid prompts!

➡️ **Ready for more?** Continue to [Part 2: How AI Reads (Byte Pair Encoding)](/mobile-infra-blog/llms-from-scratch-part-2-tokenization/) where we build a tokenizer from scratch!

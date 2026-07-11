---
title: "Building SmartNotes: On-Device AI with Gemini Nano and Jetpack Compose"
description: "A deep dive into building a modern Android note-taking app with on-device AI using ML Kit's GenAI APIs, Room, Hilt, and Jetpack Compose."
pubDate: 2026-07-10
tags: ["android", "gemini-nano", "jetpack-compose", "on-device-ai", "architecture"]
draft: false
---

## Introduction

In mobile systems engineering, offloading high-frequency NLP tasks like text summarization to cloud-based LLMs introduces three primary bottlenecks: network latency overhead, recurring operational costs, and data governance liabilities around GDPR/CCPA compliance.

To resolve these bottlenecks in **SmartNotes**, we integrated Google's **ML Kit GenAI APIs** — a high-level abstraction built on top of [AICore](https://android-developers.googleblog.com/2023/12/a-new-foundation-for-ai-on-android.html), Android's system service for on-device Gemini Nano execution. This transition eliminates runtime API costs, removes network dependencies entirely, and processes all user data locally on the device.

This post covers the architecture decisions, the correct integration path via ML Kit, and the real-world constraints you need to plan for.

---

## What the Stack Actually Is

It is important to understand the layering before writing any code:

```
┌─────────────────────────────────┐
│         SmartNotes App          │
├─────────────────────────────────┤
│     ML Kit GenAI APIs           │  ← your integration point
│  (com.google.mlkit:genai-*)     │
├─────────────────────────────────┤
│          AICore                 │  ← Android system service
│  (manages Gemini Nano on device)│
├─────────────────────────────────┤
│         Gemini Nano             │  ← the model (nano-v2 / nano-v3)
└─────────────────────────────────┘
```

You do **not** talk to AICore directly. ML Kit's GenAI APIs are the public interface. AICore is the system-level runtime that handles model lifecycle, quota enforcement, and privacy isolation — it is not a library you import.

---

## Modular Gradle Architecture

We structure the AI engine as decoupled Gradle modules to prevent tight coupling between the presentation layer and the ML Kit dependencies:

```
┌──────────────┐
│    :app      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  :core:ui    │
└──────┬───────┘
       │
  ┌────┴────────────────┐
  ▼                     ▼
┌──────────────┐  ┌──────────────┐
│  :core:ai    │  │:core:database│
│ (Contracts)  │  │  (Room DB)   │
└──────────────┘  └──────────────┘
       ▲
       │ (Runtime Binding)
┌──────────────┐
│:core:ai-impl │  (ML Kit GenAI)
└──────────────┘
```

The interface contracts in `:core:ai` keep `:core:ui` decoupled from ML Kit at compile time. This means standard CI runs — on non-Pixel Linux VMs — can mock the AI layer entirely and never pull in the ML Kit GenAI dependency.

---

## Gradle Dependencies

Add the ML Kit Summarization API to your `:core:ai-impl` module's `build.gradle.kts`:

```kotlin
// Requires Android API level 26 (Android 8.0) or higher
implementation("com.google.mlkit:genai-summarization:1.0.0-beta1")
```

This is the only dependency you need for summarization. The Gemini Nano model weights themselves are **not bundled in your APK** — they are managed and shared by AICore at the system level. If Gemini Nano is already present on the device (shared across apps), only a small feature-specific LoRA adapter is downloaded. Your APK binary impact is minimal.

---

## Device Support

ML Kit GenAI APIs are **not** available on all Android devices. Support is tied to specific hardware that has Gemini Nano provisioned by AICore. As of mid-2026, supported devices include:

- **Google**: Pixel 9, Pixel 9 Pro, Pixel 9 Pro XL, Pixel 9 Pro Fold, Pixel 10 series
- **Samsung**: Galaxy S25, S25+, S25 Ultra, S26 series, Z Fold7, Z TriFold
- **Xiaomi**: Xiaomi 15, 15 Ultra, 15T, 15T Pro, 17 series
- **OnePlus**: OnePlus 13, 13s, 15, 15R
- **OPPO, vivo, Motorola, Honor, POCO, realme, Sharp, Lenovo, iQOO**: selected flagship models

Two Gemini Nano variants are in the field — `nano-v2` and `nano-v3` — running on different device families. Outputs can differ between variants. Always call `checkFeatureStatus()` at runtime rather than assuming availability from the device model name.

---

## On-Device Summarization Implementation

The `SummarizationService` in `:core:ai-impl` wraps ML Kit's API behind the `AiService` interface contract:

```kotlin
package com.example.smartnotes.core.aiimpl

import android.content.Context
import com.google.mlkit.genai.summarization.Summarization
import com.google.mlkit.genai.summarization.SummarizationRequest
import com.google.mlkit.genai.summarization.SummarizerOptions
import com.google.mlkit.genai.summarization.SummarizerOptions.InputType
import com.google.mlkit.genai.summarization.SummarizerOptions.OutputType
import com.google.mlkit.genai.summarization.SummarizerOptions.Language
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.common.DownloadCallback
import com.google.mlkit.genai.common.GenAiException
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.suspendCancellableCoroutine
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

@Singleton
class SummarizationService @Inject constructor(
    @ApplicationContext private val context: Context
) : AiService {

    private val summarizerOptions = SummarizerOptions.builder(context)
        .setInputType(InputType.ARTICLE)
        .setOutputType(OutputType.THREE_BULLETS)
        .setLanguage(Language.ENGLISH)
        .build()

    private val summarizer = Summarization.getClient(summarizerOptions)

    /**
     * Checks feature availability and triggers a download if needed,
     * then runs inference with a streaming callback.
     *
     * IMPORTANT: AICore only permits inference when the app is the
     * top foreground application. Background / foreground service
     * calls will receive ErrorCode.BACKGROUND_USE_BLOCKED.
     */
    override suspend fun summarize(
        text: String,
        onPartialResult: (String) -> Unit
    ) {
        val featureStatus = summarizer.checkFeatureStatus().await()

        when (featureStatus) {
            FeatureStatus.UNAVAILABLE -> {
                throw UnsupportedOperationException(
                    "Gemini Nano is not available on this device."
                )
            }
            FeatureStatus.DOWNLOADABLE -> {
                // Trigger explicit download first, then infer.
                // If skipped, the first runInference call will
                // also trigger download — but explicit is better UX.
                suspendCancellableCoroutine { cont ->
                    summarizer.downloadFeature(object : DownloadCallback {
                        override fun onDownloadStarted(bytesToDownload: Long) {}
                        override fun onDownloadProgress(totalBytesDownloaded: Long) {}
                        override fun onDownloadCompleted() = cont.resume(Unit)
                        override fun onDownloadFailed(e: GenAiException) =
                            cont.resumeWithException(e)
                    })
                }
                runInference(text, onPartialResult)
            }
            FeatureStatus.DOWNLOADING,
            FeatureStatus.AVAILABLE -> runInference(text, onPartialResult)
        }
    }

    private fun runInference(text: String, onPartialResult: (String) -> Unit) {
        val request = SummarizationRequest.builder(text).build()
        // Streaming: callback fires incrementally as tokens are generated
        summarizer.runInference(request) { newText ->
            onPartialResult(newText)
        }
    }

    override fun close() = summarizer.close()
}
```

---

## Real Constraints to Plan For

These are not hypothetical edge cases — they will affect your users.

### 1. Feature Availability Gating

`FeatureStatus` can be one of four states: `UNAVAILABLE`, `DOWNLOADABLE`, `DOWNLOADING`, or `AVAILABLE`. Never show AI UI elements without first checking `checkFeatureStatus()`. If the status is `UNAVAILABLE`, disable AI actions and fall back to a local heuristic (e.g., extracting the first two sentences as a pseudo-summary).

### 2. Input Length Limit

The Summarization API accepts **up to 4,000 tokens** (approximately 3,000 English words). For `InputType.ARTICLE`, the input must also be **at least 400 characters**. If a note exceeds the token limit, either enable auto-truncation:

```kotlin
SummarizerOptions.builder(context)
    .setInputType(InputType.ARTICLE)
    .setOutputType(OutputType.THREE_BULLETS)
    .setLanguage(Language.ENGLISH)
    .setLongInputAutoTruncationEnabled(true)  // trims from the end
    .build()
```

or segment the note into 4,000-token chunks and summarize each, then combine.

### 3. AICore Quota Enforcement

AICore enforces **per-app inference quotas**. Exceeding the rate limit returns `ErrorCode.BUSY`. Exceeding a longer-duration quota (e.g., daily) returns `ErrorCode.PER_APP_BATTERY_USE_QUOTA_EXCEEDED`. Implement exponential backoff for `BUSY` responses and surface a non-blocking message for quota exhaustion rather than crashing.

### 4. Background Use is Blocked

Inference is **only permitted when the app is the top foreground application**. Calling the API from a background service or when the app is not in focus returns `ErrorCode.BACKGROUND_USE_BLOCKED`. Do not attempt to run batch summarization jobs in the background.

### 5. Boot / AICore Initialization Delay

On a freshly set up device or after an AICore reset, the system service may not have finished initialization. `checkFeatureStatus()` may return `UNAVAILABLE` transiently. This resolves on its own within minutes to a few hours once the device connects to the internet. Surface this gracefully — do not treat it as a permanent hardware incompatibility.

### 6. Unlocked Bootloader

ML Kit GenAI APIs do **not** work on devices with an unlocked bootloader. `checkFeatureStatus()` will return `UNAVAILABLE`.

---

## Streaming vs. Non-Streaming

ML Kit GenAI APIs offer both modes:

| Mode | When to use |
|:---|:---|
| **Streaming** | Long outputs (e.g., three-bullet summaries) — shows text as it generates, reducing perceived latency |
| **Non-streaming** | Short outputs or batch processing — waits for the full result before returning |

For SmartNotes summarization, streaming is the correct choice. Users see bullet points appearing in real time rather than waiting for the full response.

```kotlin
// Streaming (used in SmartNotes)
summarizer.runInference(request) { newText -> updateUi(newText) }

// Non-streaming alternative
val result = summarizer.runInference(request).get().summary
```

---

## CI/CD Architecture

Our GitHub Actions pipeline validates the AI layer without requiring real hardware:

1. **Unit / ViewModel tests**: The `:core:ai` interface is mocked. Standard pull request runs execute on standard Linux VMs in under 9 minutes.
2. **Instrumented tests**: Nightly runs on physical Pixel 9 devices in a device lab validate real `checkFeatureStatus()` → `runInference()` flows against AICore.
3. **APK size audits**: A CI step runs `measure-binary-size` on every merge to `main`. Because Gemini Nano model weights are managed externally by AICore (shared across all apps on the device), the ML Kit dependency adds only the client wrapper to your APK — not the model itself.

---

## Conclusion

ML Kit's GenAI APIs are the correct, documented integration path for Gemini Nano on Android. The key architectural principles:

- **Use `checkFeatureStatus()` before any UI** — availability is not guaranteed across the device ecosystem
- **Respect the 4,000-token input limit** — plan for truncation or segmentation on long notes
- **Handle quota errors with backoff** — AICore enforces rate and daily limits per app
- **Keep inference in the foreground** — background use is explicitly blocked by AICore
- **Do not bundle the model** — Gemini Nano is a shared system resource managed by AICore

Sample code from Google: [googlesamples/mlkit — android/genai](https://github.com/googlesamples/mlkit/tree/master/android/genai)

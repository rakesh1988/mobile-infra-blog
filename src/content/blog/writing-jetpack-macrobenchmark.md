---
title: "Writing Your First Jetpack Macrobenchmark for Android"
description: "A practical guide to setting up and writing Jetpack Macrobenchmark tests to measure your Android app's cold start performance reliably."
pubDate: "2026-05-15"
tags: ["Android", "Performance", "Macrobenchmark", "Testing", "Engineering Productivity"]
draft: false
---

In a previous post, we discussed the architecture of solving slow Android cold starts and integrating those checks into CI/CD. The core engine behind that automated gatekeeping is **Jetpack Macrobenchmark**.

Unlike traditional microbenchmarks (which test tiny functions in isolation), Macrobenchmark tests the app from the user's perspective. It launches the actual application process, interacts with the UI, and captures deep system-level traces using Perfetto. 

If you've never set one up before, here is a step-by-step guide to writing your first cold start Macrobenchmark.

## Step 1: Create the Benchmark Module

Macrobenchmark requires its own dedicated module in your Android project. It cannot run inside your standard `app` module because it needs to install and launch your app as a separate process (just like a real user would).

In Android Studio, the easiest way to do this is to use the template:
1. Go to **File > New > New Module...**
2. Select **Benchmark**.
3. Choose **Macrobenchmark** as the Benchmark type.
4. Select your target application module (usually `app`).

Android Studio will automatically generate the `benchmark` module, configure the heavily customized `build.gradle`, and set up the necessary `AndroidManifest.xml`.

## Step 2: Writing the Cold Start Test

Once the module is generated, you will find a sample test class. Let's write a robust test specifically designed to measure **Cold Start** time.

```kotlin
package com.yourcompany.app.benchmark

import androidx.benchmark.macro.CompilationMode
import androidx.benchmark.macro.StartupMode
import androidx.benchmark.macro.StartupTimingMetric
import androidx.benchmark.macro.junit4.MacrobenchmarkRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ColdStartBenchmark {

    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()

    @Test
    fun startupNoCompilation() = benchmarkRule.measureRepeated(
        packageName = "com.yourcompany.app",
        metrics = listOf(StartupTimingMetric()),
        iterations = 5,
        startupMode = StartupMode.COLD,
        compilationMode = CompilationMode.None()
    ) {
        // Press home button before starting to ensure a clean state
        pressHome()
        
        // Launch the application
        startActivityAndWait()
    }
}
```

### Breaking down the code:
* **`StartupTimingMetric()`**: This tells the framework to automatically measure Time to Initial Display (TTID) and Time to Full Display (TTFD).
* **`iterations = 5`**: Benchmarks are noisy. The framework runs the test 5 times and calculates the median, minimum, and maximum times to give you a statistically significant result.
* **`CompilationMode.None()`**: This simulates the absolute worst-case scenario—a user launching the app immediately after downloading it from the Play Store, before Android's Ahead-of-Time (AOT) compilation or Baseline Profiles have had a chance to optimize the code.

## Step 3: Measuring with Baseline Profiles

If your app uses Baseline Profiles (which it absolutely should), you'll want a second test to measure how much faster the app starts when the profile is applied. 

You can simply add another test to the same class:

```kotlin
    @Test
    fun startupPartialCompilation() = benchmarkRule.measureRepeated(
        packageName = "com.yourcompany.app",
        metrics = listOf(StartupTimingMetric()),
        iterations = 5,
        startupMode = StartupMode.COLD,
        compilationMode = CompilationMode.Partial() // Simulates Baseline Profiles
    ) {
        pressHome()
        startActivityAndWait()
    }
```
By comparing `CompilationMode.None()` to `CompilationMode.Partial()`, you can prove exactly how much value your Baseline Profiles are providing to your end-users.

## Step 4: Running the Benchmark

There are two strict rules for running Macrobenchmarks:
1. **It must run on a physical device.** Emulators are heavily virtualized and will give wildly inaccurate CPU timings.
2. **The app must be a Release build.** You must measure the fully minified, obfuscated, and signed APK. The Benchmark module automatically configures itself to build the `app` module in release mode.

Plug in a physical test device, select the `benchmark` module in your Run Configurations dropdown, and hit Run. 

## Step 5: Analyzing the Results

When the test finishes, Android Studio will print a summary in the Run console that looks like this:

```text
ColdStartBenchmark_startupNoCompilation
  timeToInitialDisplayMs   min 345.2,   median 361.5,   max 412.1
  timeToFullDisplayMs      min 850.1,   median 885.3,   max 940.5
```

More importantly, it generates deep **Perfetto traces** for every single iteration. You can click the links directly in the console to open these traces in Android Studio, allowing you to see the exact thread states and method calls that occurred during the cold start.

## Next Steps: CI Integration

Once you have this test running locally, the final step is to run it on a cloud device farm (like Firebase Test Lab) during your nightly CI runs. The benchmark generates a JSON output file containing the median metrics. By writing a simple bash script to parse that JSON in GitLab, you can automatically fail the build if the median `timeToInitialDisplayMs` spikes beyond your acceptable threshold. 

That is how you achieve continuous performance protection.

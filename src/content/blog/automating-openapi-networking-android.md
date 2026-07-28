---
title: "Automating OpenAPI Network Layers in Mobile Apps"
description: "Why manually writing data classes and OkHttp clients for OpenAPI specs is a thing of the past, and how we can automate this routine work."
pubDate: "2026-01-28"
tags: ["Android", "OpenAPI", "Networking", "Automation", "Kotlin"]
draft: false
---

Connecting to backend APIs is a fundamental part of almost every mobile application. Today, many teams rely on **OpenAPI Specifications (Swagger)** to define the contract between the frontend and the backend. It provides a clear, machine-readable blueprint of all available endpoints, request parameters, and response models.

However, a very common anti-pattern emerges when we actually go to implement this in our apps: **We do it manually.**

## The Routine Work

If you look at the typical workflow for integrating a new OpenAPI endpoint, it usually looks something like this:

1. Look at the YAML or JSON specification.
2. Hand-craft Kotlin `data class`es to represent the request and response models.
3. Add the necessary serialization annotations (like `@SerializedName` or `@Json`).
4. Write a Retrofit interface or configure an OkHttp client to make the actual network call.

Isn't this just routine work? 

The answer is a resounding **yes**. 

Writing boilerplate code to map a well-defined specification into a network layer is tedious, time-consuming, and highly susceptible to human error. A simple typo in a property name or a mismatched data type can lead to frustrating runtime crashes that could have been completely avoided.

## The Business Value: Why Product Owners Should Care

For a non-technical stakeholder, like a Product Owner or Project Manager, the concept of "generating models" might sound like deep engineering jargon. However, the business implications of doing this manually versus automating it are massive:

1. **Faster Time-to-Market**: When a new feature requires a backend integration, developers spend hours manually typing out API contracts. By automating this, that time drops to literally zero. Engineers can start building the actual user-facing features immediately.
2. **Fewer Production Bugs**: Manual typing introduces human error. A misspelled variable or wrong data type (like expecting a number but receiving text) causes the app to crash in production. Automation guarantees a 100% accurate match with the backend, eliminating an entire category of crashes.
3. **Cheaper Maintenance**: APIs change. When the backend team updates an endpoint, the mobile team traditionally has to comb through the codebase to manually apply those updates. With code generation, they just run a script, and the app instantly adapts to the new changes. This drastically reduces the cost of maintaining the app over time.

In short: Automating the network layer means you get features delivered faster, with higher quality, and at a lower ongoing maintenance cost.

## Why Automate? (The Technical Perspective)

If the specification already knows everything about the API, our code should be generated from it directly. Here is why automating your OpenAPI network layer is a game-changer for mobile infrastructure:

### 1. Eliminates Boilerplate
Developers should spend their time building features, not writing data classes. By generating the network layer, you instantly eliminate hundreds (or thousands) of lines of boilerplate code.

### 2. Single Source of Truth
When the backend team updates the API spec, you shouldn't have to manually hunt down what changed. With code generation, you simply update the spec, run a script, and your models and network clients are immediately synchronized with the backend. 

### 3. Type Safety and Zero Typos
Manually mapping JSON keys is a recipe for disaster. Generating the models guarantees that your Kotlin data types exactly match the OpenAPI spec, eliminating a whole class of runtime errors.

## The Challenge with the Standard Plugin

The OpenAPI Generator ecosystem is fantastic, but using the standard Gradle plugin out-of-the-box presents a challenge for large mobile projects. 

By default, the plugin provides a single `openApiGenerate` task that points to a single specification file. However, in a microservices architecture, a mobile app might consume APIs from dozens of different backend services, each with its own YAML spec. Configuring the standard plugin for 20 different APIs would mean manually registering and configuring 20 separate tasks in the `build.gradle` file, leading to a massive, unmaintainable build script.

Furthermore, we didn't want to pollute our main application module with generated code. Mixing generated network models with UI code slows down build times and breaks clean architecture boundaries. 

To solve this, we decided to create a dedicated, isolated `network` module and write a custom Gradle script to dynamically process any specification file we drop into it.

## How We Solved It

We automated this entire workflow by using the [OpenAPI Generator Gradle Plugin](https://openapi-generator.tech/docs/plugins) in a dynamic way. Here is how we integrated it into our dedicated network module's build pipeline to seamlessly generate Kotlin network layers from our YAML specifications.

### 1. The Core Idea: Convention Over Configuration

Before diving into the code, it's crucial to understand the *strategy* we employed. Rather than manually configuring a new task every time a backend team adds a new microservice, we designed a system based on **conventions**:

1. **File-Based Routing**: We treat the `openapi/` folder as a single source of truth. The script simply scans this directory.
2. **Convention-Based Naming**: We use the filename of the YAML spec itself to deduce what the generated Kotlin package should be named. For instance, dropping a file named `payments_v1.yaml` implicitly tells the build system to generate code in a `payments.v1` package.
3. **Dynamic Task Registration**: For every file found, Gradle dynamically spawns a unique `GenerateTask` specific to that API.
4. **Transparent Wiring**: Finally, we intercept Gradle's compilation phase and tell it to include all our dynamically generated folders (living in `$buildDir`) as valid source code. 

By applying this idea, developers never have to touch the Gradle file again when adding a new API. They just drop the YAML file into the folder and hit "Build".

### 2. Gradle Configuration

First, we set up our version catalog (`libs.versions.toml`) to include the OpenAPI generator plugin:

```toml
[versions]
openapiGenerator = "7.2.0" # Use the latest version

[plugins]
openapi = { id = "org.openapi.generator", version.ref = "openapiGenerator" }
```

With the plugin available, we implement our dynamic generation logic. Notice how we use Gradle's inputs/outputs for proper up-to-date checking—meaning we only spend time regenerating code if the specific YAML file was actually modified:

```kotlin
// build.gradle.kts
import org.openapitools.generator.gradle.plugin.tasks.GenerateTask

plugins {
    id("java-library")
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.openapi)
}

dependencies {
    api(libs.retrofit2.retrofit)
    api(libs.retrofit2.converter.moshi)
    api(libs.okhttp3.okhttp)
}

val openApiOutputDir = layout.buildDirectory.dir("generated/openapi")

// Process all yaml files in the `openapi/` folder
fileTree(project.file("openapi")) { include("*.yaml") }.forEach { specFile ->
    // Parse the file name to determine the API group and version
    // e.g., "payments_v1.yaml" -> "payments.v1"
    val baseName = specFile.nameWithoutExtension
    val packageSuffix = baseName.replace("_", ".")
    
    val taskName = "generateOpenApi${baseName.capitalize()}"
    val outputTarget = openApiOutputDir.get().dir(baseName).asFile
    
    val generateTask = tasks.register<GenerateTask>(taskName) {
        generatorName.set("kotlin")
        inputSpec.set(specFile.absolutePath)
        outputDir.set(outputTarget.absolutePath)
        
        apiPackage.set("com.example.network.$packageSuffix.api")
        modelPackage.set("com.example.network.$packageSuffix.models")
        invokerPackage.set("com.example.network.$packageSuffix.invoker")
        
        configOptions.set(mapOf(
            "library" to "jvm-retrofit2",
            "useCoroutines" to "true",
            "serializationLibrary" to "moshi" // Use your preferred parser
        ))
    }

    // Attach generated sources to the main Kotlin source set
    sourceSets.main {
        kotlin.srcDir(generateTask.map { it.outputDir.get() })
    }
    
    // Ensure code is generated before compilation
    tasks.named("compileKotlin").configure {
        dependsOn(generateTask)
    }
}
```

### 3. Developer Workflow

With this setup, the process for integrating a new API becomes incredibly streamlined for the team:

1. **Download the Spec:** Fetch the self-contained OpenAPI specification for the REST API you want to integrate.
2. **Add to Project:** Place the file in the `openapi/` directory. The file name dictates the package structure. For example, naming it `payments_v1.yaml` automatically creates the generated package: `com.example.network.payments.v1`.
3. **Build:** Trigger a compilation (e.g., `./gradlew compileKotlin`). The generated sources instantly become available in your project inside the `$buildDir`.

### 4. Using the Generated Code

Once compiled, you can immediately inject the generated API interface into your repositories using your preferred DI framework:

```kotlin
class PaymentsRepository @Inject constructor(
    @ApiV1 retrofit: Lazy<Retrofit>
) {
    // The PaymentsApi is completely auto-generated!
    private val paymentsApi: PaymentsApi by lazy { 
        retrofit.get().create(PaymentsApi::class.java) 
    }
}
```

It is important to use the proper Retrofit instance. Specifications rarely include base path prefixes (like `api/v1`), so we add them on the app side. We achieve this by exposing specific Retrofit instances qualified with annotations (like `@ApiV1`).

## Future Improvements: A Custom Gradle Plugin

While the script above works perfectly, iterating over files and dynamically registering tasks directly in a `build.gradle` file can eventually become cluttered as the build complexity grows. 

The natural next step for this idea is to extract this entire logic into a **custom Gradle plugin**. By doing so, we can abstract the OpenAPI generator configuration behind a clean DSL wrapper. Developers would simply apply the internal plugin, point it to a folder, and the plugin would handle the dynamic task registration, caching, and source set wiring entirely behind the scenes.

## Conclusion

By shifting from manual model creation to automated OpenAPI generation, we transformed a tedious, error-prone chore into a robust and frictionless pipeline. Our models are always in sync with the backend, typos are a thing of the past, and our engineers can focus on building features rather than writing boilerplate network layers.


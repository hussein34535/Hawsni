plugins {
  // Add the dependency for the Google services Gradle plugin
  id("com.google.gms.google-services") version "4.4.4" apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// Comment out the custom build directory configuration
// rootProject.layout.buildDirectory.set(file("../build"))

// subprojects {
//    project.layout.buildDirectory.set(file("../build/${project.name}"))
// }

subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
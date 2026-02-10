plugins {
    id("com.google.gms.google-services") version "4.4.4" apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// هذا السطر يحدد مسار البناء ليكون في المجلد الرئيسي للمشروع (hwasi/build)
// استخدام projectDirectory.dir("../build") هو الطريقة الأدق والأكثر أماناً
val newBuildDir = layout.projectDirectory.dir("../build")
layout.buildDirectory.value(newBuildDir)

subprojects {
    // توجيه ملفات بناء المشاريع الفرعية (مثل app) إلى داخل المجلد الرئيسي أيضاً
    val subprojectBuildDir = newBuildDir.dir(project.name)
    layout.buildDirectory.value(subprojectBuildDir)
}

subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
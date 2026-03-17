@ECHO OFF
SETLOCAL EnableDelayedExpansion

SET "WRAPPER_DIR=%~dp0.mvn\wrapper"
SET "WRAPPER_JAR=%WRAPPER_DIR%\maven-wrapper.jar"
SET "WRAPPER_PROPS=%WRAPPER_DIR%\maven-wrapper.properties"
SET "MMD=%~dp0"
SET "MMD=%MMD:~0,-1%"

IF NOT EXIST "%WRAPPER_JAR%" (
  FOR /F "usebackq tokens=1,2 delims==" %%A IN ("%WRAPPER_PROPS%") DO (
    IF "%%A"=="wrapperUrl" SET "WRAPPER_URL=%%B"
  )
  IF "!WRAPPER_URL!"=="" (
    ECHO Maven wrapperUrl not found in %WRAPPER_PROPS%
    EXIT /B 1
  )

  IF NOT EXIST "%WRAPPER_DIR%" (
    MKDIR "%WRAPPER_DIR%"
  )

  ECHO Downloading Maven Wrapper jar...
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "Invoke-WebRequest -UseBasicParsing -Uri '!WRAPPER_URL!' -OutFile '%WRAPPER_JAR%'" || EXIT /B 1
)

SET "MAVEN_OPTS=%MAVEN_OPTS% -Dmaven.multiModuleProjectDirectory=%MMD%"

java -Dmaven.multiModuleProjectDirectory="%MMD%" -classpath "%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*
EXIT /B %ERRORLEVEL%


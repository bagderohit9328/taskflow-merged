#!/bin/sh
set -euf

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
WRAPPER_DIR="$BASE_DIR/.mvn/wrapper"
WRAPPER_JAR="$WRAPPER_DIR/maven-wrapper.jar"
WRAPPER_PROPS="$WRAPPER_DIR/maven-wrapper.properties"

if [ ! -f "$WRAPPER_JAR" ]; then
  WRAPPER_URL="$(grep '^wrapperUrl=' "$WRAPPER_PROPS" | sed 's/^wrapperUrl=//')"
  if [ -z "${WRAPPER_URL:-}" ]; then
    echo "Maven wrapperUrl not found in $WRAPPER_PROPS" >&2
    exit 1
  fi
  mkdir -p "$WRAPPER_DIR"
  echo "Downloading Maven Wrapper jar..."
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$WRAPPER_URL" -o "$WRAPPER_JAR"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$WRAPPER_JAR" "$WRAPPER_URL"
  else
    echo "Neither curl nor wget is available to download Maven wrapper." >&2
    exit 1
  fi
fi

exec java -Dmaven.multiModuleProjectDirectory="$BASE_DIR" -classpath "$WRAPPER_JAR" org.apache.maven.wrapper.MavenWrapperMain "$@"


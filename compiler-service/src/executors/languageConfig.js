// Language configuration: maps CodeRome language keys to Docker execution config
const LANGUAGE_CONFIG = {
  python3: {
    image: 'python:3.11-slim',
    extension: 'py',
    filename: 'solution.py',
    cmd: 'python3 /code/solution.py < /code/input.txt',
  },
  java: {
    image: 'eclipse-temurin:17-jdk',
    extension: 'java',
    filename: 'Main.java',
    // NOTE: users must name their public class 'Main'
    cmd: 'cd /code && javac Main.java 2>&1 && java Main < /code/input.txt',
  },
  cpp: {
    image: 'gcc:latest',
    extension: 'cpp',
    filename: 'solution.cpp',
    cmd: 'g++ -o /tmp/sol /code/solution.cpp 2>&1 && /tmp/sol < /code/input.txt',
  },
  c: {
    image: 'gcc:latest',
    extension: 'c',
    filename: 'solution.c',
    cmd: 'gcc -o /tmp/sol /code/solution.c 2>&1 && /tmp/sol < /code/input.txt',
  },
  nodejs: {
    image: 'node:18-slim',
    extension: 'js',
    filename: 'solution.js',
    cmd: 'node /code/solution.js < /code/input.txt',
  },
  ruby: {
    image: 'ruby:3.2-slim',
    extension: 'rb',
    filename: 'solution.rb',
    cmd: 'ruby /code/solution.rb < /code/input.txt',
  },
  go: {
    image: 'golang:1.21-alpine',
    extension: 'go',
    filename: 'solution.go',
    cmd: 'go run /code/solution.go < /code/input.txt',
  },
  rust: {
    image: 'rust:slim',
    extension: 'rs',
    filename: 'solution.rs',
    cmd: 'rustc -o /tmp/sol /code/solution.rs 2>&1 && /tmp/sol < /code/input.txt',
  },
  php: {
    image: 'php:8.2-cli',
    extension: 'php',
    filename: 'solution.php',
    cmd: 'php /code/solution.php < /code/input.txt',
  },
  swift: {
    image: 'swift:5.9-slim',
    extension: 'swift',
    filename: 'solution.swift',
    cmd: 'swiftc -o /tmp/sol /code/solution.swift 2>&1 && /tmp/sol < /code/input.txt',
  },
  csharp: {
    image: 'mcr.microsoft.com/dotnet/sdk:7.0',
    extension: 'cs',
    filename: 'Program.cs',
    cmd: [
      'mkdir -p /tmp/csapp',
      'cp /code/Program.cs /tmp/csapp/Program.cs',
      'echo \'<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net7.0</TargetFramework><Nullable>enable</Nullable></PropertyGroup></Project>\' > /tmp/csapp/csapp.csproj',
      'cd /tmp/csapp && dotnet run < /code/input.txt',
    ].join(' && '),
  },
  scala: {
    image: 'sbtscala/scala-sbt:eclipse-temurin-jammy-11.0.22_7_1.10.0_3.3.3',
    extension: 'scala',
    filename: 'solution.scala',
    cmd: 'cd /code && scala solution.scala < /code/input.txt',
  },
  r: {
    image: 'r-base:4.3.1',
    extension: 'R',
    filename: 'solution.R',
    cmd: 'Rscript /code/solution.R < /code/input.txt',
  },
  bash: {
    image: 'bash:5.2',
    extension: 'sh',
    filename: 'solution.sh',
    cmd: 'bash /code/solution.sh < /code/input.txt',
  },
  pascal: {
    image: 'nickblah/fpc:latest',
    extension: 'pas',
    filename: 'solution.pas',
    cmd: 'cp /code/solution.pas /tmp/solution.pas && cd /tmp && fpc solution.pas 2>&1 && ./solution < /code/input.txt',
  },
  sql: {
    image: 'mysql:8.0',
    extension: 'sql',
    filename: 'solution.sql',
    cmd: 'mysql --user=root --password="" < /code/solution.sql 2>&1',
  },
};

module.exports = { LANGUAGE_CONFIG };

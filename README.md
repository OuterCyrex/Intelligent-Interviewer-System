# AI Mock Interview and Skill Improvement Platform

An AI-powered mock interview platform for computer science students. The goal is to help users practice for target roles, receive instant feedback, and continuously improve through a closed loop of mock interview, evaluation, and guided improvement.

## Background

As the number of graduates continues to grow, job market competition becomes more intense. Many students have solid technical knowledge, but still struggle in real interviews because they:

- lack realistic interview practice
- do not receive timely and structured feedback
- are unclear about the focus of different technical roles
- need improvement in technical communication, logical thinking, and self-expression

This project uses large language models, multi-turn dialogue, knowledge retrieval, and structured evaluation to provide an AI interview coach that students can practice with repeatedly.

## Project Goals

- Provide role-oriented mock interview experiences
- Support multi-turn questioning with dynamic follow-up
- Evaluate both answer content and communication performance
- Generate structured interview reports and improvement suggestions
- Record interview history to support progress tracking

## MVP Scope

The current phase focuses on a practical MVP with a complete end-to-end flow:

- Support at least two target roles
- `Java Backend Engineer`
- `Web Frontend Engineer`
- Support text-based mock interviews
- Support speech input through speech-to-text integration
- Support dynamic follow-up questions
- Generate structured evaluation reports
- Support interview history and basic recommendation features

## Tech Stack

Current backend baseline:

- `Go`
- `Gin`
- `PostgreSQL`
- `pgx`
- `Viper`

The backend uses a modular monolith architecture and exposes REST APIs. In the MVP phase, the priority is delivery speed, maintainability, and local runnability. Retrieval, scoring, and multimodal capabilities can be improved incrementally later.

## Core Backend Modules

- `position`: role definitions and evaluation dimensions
- `questionbank`: role-specific interview question management
- `knowledge`: knowledge base and document chunk management
- `interview`: interview session orchestration
- `conversation`: multi-turn dialogue context management
- `llm`: large model integration layer
- `rag`: retrieval-augmented knowledge lookup
- `evaluation`: multi-dimensional scoring
- `report`: interview report generation
- `recommendation`: follow-up learning suggestions
- `audio`: speech-to-text and expression metrics integration

## Development Principles

- Build the MVP loop first, then optimize
- Keep all core AI outputs as structured as possible
- Make interview flows traceable, replayable, and reusable
- Keep module boundaries clear for both developers and agents

## Next Steps

- Finalize the database schema
- Define the REST API details
- Set up the backend project scaffold
- Build the first version of the question bank, knowledge base, and evaluation rules

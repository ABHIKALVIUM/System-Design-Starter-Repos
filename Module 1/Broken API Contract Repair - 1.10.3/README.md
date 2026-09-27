# System Design — PR Assignment Starter Repo

This is a starter repo for a **System Design** PR assignment at Kalvium.

---

## About the Course

**System Design** is a core engineering course in the Kalvium B.Tech CS program. The course teaches you how real software systems are designed before a single line of code is written — how engineers translate messy requirements into bounded promises, how APIs communicate across services, and how good design decisions prevent entire classes of production bugs.

Module 1 covers the fundamentals:
- Translating stakeholder requirements into clean system contracts
- Tracing how requests flow through a codebase
- Reading and repairing API design violations

The skills you practice here show up in every engineering role — from backend to full-stack to system architecture.

---

## What Is a PR Assignment?

A PR (Pull Request) assignment is a hands-on exercise where you work on a real (fictional) codebase or document, make your changes, and submit them as a pull request on GitHub.

Unlike a quiz, a PR assignment tests whether you can **actually do the thing** — read a broken contract and fix it, trace a bug through three files, or cut scope from a noisy requirements dump. Your submission is the diff: the examiner reads what you changed and why.

Each assignment gives you:
- A starting point (broken code, a messy spec, or a flawed API contract)
- A clear task description explaining the scenario and what to produce
- The files you need to read and modify

---

## Your Task

Read the task description file in this repo before touching any code or documents. It will tell you:
- What the scenario is and the role you are playing
- Which files to read and which to modify or create
- What deliverables to produce (edited files, a new document, or both)
- Any constraints or hints worth knowing upfront

Do not skip the task description. The scenario context is part of what you are being evaluated on.

---

## How to Submit

Follow these steps exactly. This is the submission process for every PR assignment in this course.

### Step 1 — Fork this repo

Click **Fork** at the top-right of this GitHub page. This creates a copy of the repo under your own GitHub account.

> You are working on **your fork**, not the original repo. Do not open a PR back to the original.

### Step 2 — Clone your fork

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

Replace `<your-username>` with your GitHub username and `<repo-name>` with the repo name.

### Step 3 — Create a branch

```bash
git checkout -b my-solution
```

### Step 4 — Do the work

Read the task description. Make your changes. Create any new files the task asks for. There is no autograder or timer — take the time to think through your decisions.

### Step 5 — Commit and push

```bash
git add .
git commit -m "Complete assignment"
git push origin my-solution
```

### Step 6 — Open a PR on your own fork

Go to **your forked repo** on GitHub (not the original).

Click **Pull requests → New pull request**.

Set it up like this:
- **base repository**: `<your-username>/<repo-name>` ← this must be YOUR fork, not the original
- **base branch**: `main`
- **compare branch**: `my-solution`

In the PR description, write a few lines explaining:
- What you changed and why
- Any decisions where you had more than one option and why you picked this one
- Anything you are uncertain about or would revisit given more time

Then click **Create pull request**.

### Step 7 — Share the repo link

Copy the URL of your GitHub repo (not just the PR link — the repo itself):

```
https://github.com/<your-username>/<repo-name>
```

Submit this link on the Kalvium platform where the assignment was posted. Your reviewer will find the PR from there.

---

## Before You Submit — Quick Checklist

- [ ] The PR is on **your fork**, not the original repo
- [ ] You created a branch and the PR compares that branch against `main` on your fork
- [ ] All files the task asked you to create or edit are present in the diff
- [ ] Your PR description explains your reasoning, not just what you did
- [ ] The link you are submitting is the **repo URL**, not a file or PR URL

---

## What Reviewers Look For

- Did you do the task, or just write about it?
- Are your changes specific and reasoned, not vague?
- If the task asks for a written explanation, is your reasoning clear and grounded in the scenario?
- If the task involves code, does it reflect the design principle being taught?

There is no single right answer for most of these assignments. Strong submissions explain *why* they made the choices they did.

---

## Questions?

**If the task description is unclear:** re-read it once from the top before asking. Most confusion comes from skipping the scenario context at the beginning.

**If you are stuck on the concept:** go back to the lesson on this topic. The assignment is designed to test what the lesson taught — the answer is there.

**If you think something in the repo is broken** (a file is missing, a link is dead, the code does not run when it should): raise it with your mentor immediately, not after you submit. Do not assume the broken thing is part of the puzzle.

**If you are not sure whether your solution is correct:** submit it anyway and explain your uncertainty in the PR description. A submission that says "I chose X over Y because Z, but I am not confident about the edge case where..." is far better than no submission.

---

## Identification of Violations

The three design violations were identified by auditing the OpenAPI specification and Express implementation against core REST principles: HTTP GET was inappropriately used for a state-mutating operation, internal database columns and scoring logic were leaked across the public boundary, and breaking contract changes lacked explicit version negotiation and deprecation headers.


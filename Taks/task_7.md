# Task 7 Data Resource Management
### Governance and Quality
**Maximum grade: 2 points | Time: 50 minutes | Work: team + individual**

---

## Purpose
Use your team’s semester project to show what data its information system collects and processes, why the data are needed, how the team can check their quality, and who should be responsible for them. You will design and audit a small fictional dataset. Do not use real personal or confidential data.

---

## 50-Minute Plan

| Time | Work |
| :--- | :--- |
| **0–5 min** | Choose one important user action in your team project and assign quick roles. |
| **5–15 min** | Map the data the system needs and why it needs them. |
| **15–25 min** | Define a small dataset and create five fictional records. |
| **25–38 min** | Audit the dataset using the six quality questions and calculate two measures. |
| **38–42 min** | Agree on a governance rule, owner and corrective action. |
| **42–50 min** | Each student completes the individual section independently. |

---

## Submission Rules
* Each student submits one Word file (`.docx`) containing both the complete team section and that student’s individual section. Do not submit separate attachments.
* **File name:** `StudentID_Name_Task7.docx`
* The team section must be the same in every team member’s file. The individual section must be written by each student alone and must be unique.
* Make the team work in this document. Tables, calculations and any evidence must be included in the same file.

---

## Part 1 Team Project Block | Maximum 1 Point
Work together. Select one important action in your team’s information system, such as placing an order, booking an appointment, making a payment or borrowing a book. Use your actual team project, not the Zara example from the lecture.

### Step 1 Data Map
List at least four data items your project uses. For each item, say who or what creates it, whether it is structured or unstructured, who uses it, and why it is needed for the selected action.

| Data item | Created by / source | Structured or unstructured | Who uses it and why? |
| :--- | :--- | :--- | :--- |
| **1.** | | | |
| **2.** | | | |
| **3.** | | | |
| **4.** | | | |

---

### Step 2 Mini Data Dictionary
Choose one important dataset related to the action. Define four fields and the rule for each field. Explain why the system needs this dataset.

* **Dataset name:** ______________________________
* **Why the system needs it:** ______________________________________________

| Field name | Meaning | Format / example | Required? / rule |
| :--- | :--- | :--- | :--- |
| **1.** | | | |
| **2.** | | | |
| **3.** | | | |
| **4.** | | | |

---

### Step 3 Five Fictional Records
Create five fictional records using your four fields. The team must include at least 4-5 DIFFERENT data quality problems across the rows (such as a missing value, an invalid format, a duplicate, an outdated value, or a logical inconsistency). Each teammate should focus on a different problem for their individual section. Clearly mark each problem. Do not include real names, phone numbers, addresses, payment details or other personal data.

| Record | Field 1 | Field 2 | Field 3 | Field 4 |
| :---: | :--- | :--- | :--- | :--- |
| **1** | | | | |
| **2** | | | | |
| **3** | | | | |
| **4** | | | | |
| **5** | | | | |

---

### Step 4 Quality Audit
Check the dataset using all six questions. For each one, write **PASS**, **ISSUE** or **NOT VERIFIABLE** and give one short reason.  
*Note on Accuracy:* Since this dataset is fictional, write NOT VERIFIABLE for the Accuracy dimension and state that there is no real-world source or physical user to verify these specific records against.

| Quality question | Result | Evidence / reason |
| :--- | :---: | :--- |
| **Completeness:** are required values present? | | |
| **Uniqueness:** does each real entity appear once? | | |
| **Validity:** do values follow your rules and formats? | | |
| **Accuracy:** do values match the real world? | | |
| **Consistency:** do connected systems agree? | | |
| **Timeliness:** are values current when needed? | | |

**Calculate two measures from your five-record dataset. Show your numbers and formula:**
* $\text{Completeness} = \frac{\text{filled required values}}{\text{all required values}} \times 100 = \underline{\hspace{2cm}}\%$
* *Choose one:*  
  $\text{Validity} = \frac{\text{values that follow your rule}}{\text{values checked}} \times 100 = \underline{\hspace{2cm}}\%$  
  *OR*  
  $\text{Uniqueness} = \frac{\text{unique real entities}}{\text{total records}} \times 100 = \underline{\hspace{2cm}}\%$

---

### Step 5 Governance Decision
Based on the issue you found, propose one practical governance control. Name the data owner, state one clear rule for who may create or change the data, and explain what the system or team should do when a record fails the rule.

| Data owner / role | Rule | What happens when the rule fails? |
| :--- | :--- | :--- |
| | | |

---

## Part 2 Individual Block | Maximum 1 Point
*Complete this section alone. Use your own reasoning. Do not copy a teammate’s response.*

### Item 2.1 My Data Quality Decision | 0.5 points
Choose ONE specific field or quality problem from your team’s dataset that no other teammate has chosen for this individual section (coordinate with your team to split the problems). Explain: (a) what could go wrong for a user or manager if this specific error is left unfixed, and (b) which check or control you would prioritize and why. Use at least one lecture term, such as *completeness, validity, accuracy, consistency, timeliness, validation,* or *data owner*.

> *Grading note:* If teammates analyze the exact same data quality problem with identical reasons, points will be deducted for lack of unique individual reasoning.

**My answer:**  
________________________________________________________________________________________________________________________

---

### Item 2.2 My Contribution and Learning | 0.5 points
State exactly what you personally contributed to the team work. Name one data-related decision you made or helped make and explain why. Add one short sentence about what you understand better now or what you would improve next time. Include evidence in this same Word file by referencing a specific row, column, or cell from your team's tables, or by providing a short text excerpt of your work. Do not use generic descriptions; clearly explain your exact contribution.

* **My contribution and reason:** _______________________________________________________________________________________
* **What I learned / would improve:** ___________________________________________________________________________________

---

## Grading Rubric | Total Maximum 2 Points

| Part | Criterion | Points | What earns the points |
| :--- | :--- | :---: | :--- |
| **Team** | Project data map | 0.25 | At least four relevant data items are connected to the chosen project action, their type and purpose. |
| **Team** | Dataset design | 0.25 | The team defines four useful fields and five fictional records, with a realistic quality problem. |
| **Team** | Quality audit | 0.25 | All six dimensions are checked with reasons; two measures are calculated with a suitable formula. |
| **Team** | Governance response | 0.25 | A clear owner, practical rule and corrective action address the identified problem. |
| **Individual** | Personal quality decision | 0.50 | The student identifies a project-specific issue, explains its consequence and justifies a suitable check or control. |
| **Individual** | Contribution, reasoning and evidence | 0.50 | The student describes a specific contribution and decision with a reason, reflects on learning, and includes explained evidence. |

*Grading note: Partial credit is available for a sound project-specific attempt. A reasonable alternative can earn full credit when the student explains it clearly. General definitions without a connection to the team project are not enough.*

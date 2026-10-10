# Wireframes

Low-fidelity layouts that fix the information hierarchy and responsive behaviour before any component is built. They are deliberately plain text: they live next to the code, show up in diffs, and keep the discussion on structure rather than colour and typography, which belong to the design tokens (#13).

## Information architecture

Two pages, reachable from the main navigation:

| Page | Route | Purpose |
| --- | --- | --- |
| Overview | `/` | "How am I doing?" Summary, where the money went, trends and budgets for one period |
| Transactions | `/transactions` | "What exactly did I spend?" Searchable, filterable list |

The order of sections on the overview follows the questions a customer asks, from the broadest to the most detailed:

1. **Whose account is this?** Profile header
2. **Which period am I looking at?** Period selector
3. **How much did I spend, and is that more than usual?** Summary cards
4. **Where did it go?** Category breakdown
5. **Am I within my budgets?** Goals
6. **How does this compare over time?** Monthly trends

Goals sit above trends because they can need action this month; trends are for reflection.

All filter state lives in the URL, so every view below can be bookmarked, shared and restored with the back button.

## Overview: mobile (360px)

A single column. The period selector scrolls horizontally inside its own container, never the page.

> **Changed in build (#13):** the navigation stays visible below the product name instead of collapsing behind a menu button. With two destinations, a disclosure menu adds a tap, hides where you are, and adds behaviour to build and test for no gain. Revisit if the app grows past four or five destinations.

```text
+------------------------------------+
| [Skip to main content]  (on focus) |
| Spending Insights          [Menu]  |
+------------------------------------+
| John Doe                 Premium   |
| Member since 15 January 2023       |
+------------------------------------+
| Overview                    (h1)   |
| Period                             |
| ( 7d )(*30d*)( 90d )( 1y )(Custom) |
+------------------------------------+
| Total spent                        |
| R 4 250,75                         |
| ^ 12.5% more than previous period  |
+------------------------------------+
| Transactions     | Average         |
| 47               | R 90,44         |
| v 3.2% fewer     |                 |
+------------------------------------+
| Top category: Groceries            |
+------------------------------------+
| Spending by category      (h2)     |
| 16 Aug 2024 to 16 Sept 2024        |
|          .-"""-.                   |
|        /  donut  \                 |
|        \  chart  /                 |
|          '-...-'                   |
| Groceries      R 1 250,30   29.4%  |
| Entertainment    R 890,20   20.9%  |
| Transportation   R 680,45   16.0%  |
| ...                       [View >] |
+------------------------------------+
| Budgets                   (h2)     |
| Entertainment      (ok) On track   |
| [#############-------]  65%        |
| R 650,30 of R 1 000,00 · 12 days   |
| Groceries      (!) Close to limit  |
| [###################-]  97%        |
+------------------------------------+
| Monthly trends            (h2)     |
| (6m)(*12m*)(24m)                   |
|  |     _                           |
|  | _  | |  _                       |
|  || |_| |_| |  bar chart           |
|  +-----------                      |
| [Show as table]                    |
+------------------------------------+
```

## Overview: tablet (768px)

Two columns. Summary cards sit in a two by two grid, categories and budgets side by side, trends across the full width.

```text
+--------------------------------------------------------------+
| Spending Insights        Overview   Transactions             |
+--------------------------------------------------------------+
| John Doe   Premium   Member since 15 January 2023            |
| Overview (h1)        ( 7d )(*30d*)( 90d )( 1y )( Custom )    |
+------------------------------+-------------------------------+
| Total spent                  | Transactions                  |
| R 4 250,75   ^ 12.5%         | 47   v 3.2%                   |
+------------------------------+-------------------------------+
| Average transaction          | Top category                  |
| R 90,44                      | Groceries                     |
+------------------------------+-------------------------------+
| Spending by category         | Budgets                       |
|   (donut)   Groceries  29.4% | Entertainment   On track      |
|             Entertain. 20.9% | [##########------]  65%       |
|             ...              | Groceries  Close to limit     |
+------------------------------+-------------------------------+
| Monthly trends                       (6m)(*12m*)(24m)        |
| bar chart across full width                                  |
+--------------------------------------------------------------+
```

## Overview: desktop (1280px and wider)

A 12-column grid with a maximum content width, so lines stay readable on very wide screens. Four summary cards in one row.

```text
+------------------------------------------------------------------------------+
| Spending Insights            Overview   Transactions          John Doe  [P]  |
+------------------------------------------------------------------------------+
| Overview (h1)                              ( 7d )(*30d*)( 90d )( 1y )(Custom)|
+------------------+------------------+------------------+---------------------+
| Total spent      | Transactions     | Average          | Top category        |
| R 4 250,75       | 47               | R 90,44          | Groceries           |
| ^ 12.5% more     | v 3.2% fewer     |                  |                     |
+------------------+------------------+------------------+---------------------+
| Spending by category (7 cols)                | Budgets (5 cols)              |
|  (donut)   | Category       Amount   %   #   | Entertainment      On track   |
|            | Groceries   R 1 250,30 29.4 15 | [###########-------]  65%      |
|            | Entertain.    R 890,20 20.9  8 | Groceries     Close to limit   |
|            | ...                            | [##################-]  97%     |
+----------------------------------------------+-------------------------------+
| Monthly trends (12 cols)                                (6m)(*12m*)(24m)     |
| bar chart                                                   [Show as table]  |
+------------------------------------------------------------------------------+
```

On desktop the profile moves into the top bar, because the page has the width for it.

## Transactions: mobile (360px)

Filters collapse behind a button that shows how many are active. Each transaction is a list item, not a table row, so nothing scrolls sideways.

```text
+------------------------------------+
| Spending Insights          [Menu]  |
+------------------------------------+
| Transactions               (h1)    |
| [Filters (2)]   Sort [Newest   v]  |
| Groceries x   Last 30 days x       |
| 312 transactions        (live)     |
+------------------------------------+
| Pick n Pay              R 245,80   |
| Groceries · Credit Card            |
| 16 Sept 2024, 16:30                |
+------------------------------------+
| Netflix                 R 199,00   |
| Entertainment · Debit Order        |
| 15 Sept 2024, 12:15                |
+------------------------------------+
| ...                                |
+------------------------------------+
| [< Prev]   Page 1 of 16   [Next >] |
| Show [20 v] per page               |
+------------------------------------+
```

## Transactions: desktop

A real table with a caption and sortable headers. Filters sit in a toolbar above it.

```text
+------------------------------------------------------------------------------+
| Transactions (h1)                                                            |
| Category [All      v]  From [2024-08-16]  To [2024-09-16]  Sort [Newest   v] |
| [Clear filters]                                         312 transactions     |
+------------+-------------------------+---------------+--------------+--------+
| Date       | Merchant                | Category      | Payment      | Amount |
+------------+-------------------------+---------------+--------------+--------+
| 16 Sept    | Pick n Pay              | Groceries     | Credit Card  |  245,80|
| 15 Sept    | Netflix                 | Entertainment | Debit Order  |  199,00|
| ...        |                         |               |              |        |
+------------+-------------------------+---------------+--------------+--------+
| Show [20 v] per page                      [< Previous]  Page 1 of 16 [Next >]|
+------------------------------------------------------------------------------+
```

Amounts are right-aligned with tabular numerals, so the decimal commas line up.

## States

Every data view has the same four states. The layout box stays the same size across them, so nothing jumps (NFR P3).

```text
Loading                    Empty                        Error
+----------------------+   +------------------------+   +------------------------+
| Spending by category |   | Spending by category   |   | Spending by category   |
| ░░░░░░░░░░░░         |   |                        |   |                        |
| ░░░░░░░░░░░░░░░░░░   |   | No spending in this    |   | We could not load your |
| ░░░░░░░░░░           |   | period.                |   | categories.            |
| ░░░░░░░░░░░░░░       |   | [Choose another period]|   | [Retry]                |
+----------------------+   +------------------------+   +------------------------+
  aria-busy="true"           guides to a next step        role="alert", retry
                                                          refetches this view only
```

## Interaction notes

- **Period selector:** a radio group, so arrow keys move between options and only the selected option is a Tab stop. "Custom" reveals two date inputs and an Apply button.
- **Category drill-down:** selecting a category on the overview opens transactions filtered by that category and the same period.
- **Charts:** every chart has a "Show as table" control, or a list beside it that carries the same data. Colour is always paired with a name, a label or a pattern.
- **Change indicators:** an arrow, a sign and words ("more", "fewer"), never colour alone. Spending more is shown as a caution, not a success.
- **Focus after navigation:** moves to the page heading. After pagination it moves to the results heading.

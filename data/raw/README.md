# data/raw

- `customer_support_tickets.csv` is the **Customer Support Ticket Dataset** from Kaggle
  (https://www.kaggle.com/datasets/suraj520/customer-support-ticket-dataset, author *suraj520*,
  license **CC0: Public Domain**), committed **unmodified**. It is the default ETL input.
- Refresh it with `make kaggle-download` (from the repository root), then run `make etl`.
- Any other file in this folder is git-ignored.

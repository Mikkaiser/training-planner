-- Allow the app's plan color tokens while keeping legacy tokens.
-- The frontend uses: mint, iris, coral, gold, purple, teal.
-- The earlier DB constraint allowed only: red, blue, yellow, green, purple, orange.

alter table public.training_plans
  drop constraint if exists training_plans_color_check;

alter table public.training_plans
  add constraint training_plans_color_check
  check (
    color in (
      'mint','iris','coral','gold','purple','teal',
      'red','blue','yellow','green','orange'
    )
  );


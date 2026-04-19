import { TrainingPlannerLogo } from "@/components/brand/training-planner-logo";

export function AuthFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="auth-page-footer shrink-0 px-4 py-3">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-1 text-center">
        <TrainingPlannerLogo
          variant="footer"
          className="!h-6 w-auto max-h-6 md:!h-7 md:max-h-7"
        />
        <p className="text-2xs leading-tight text-tp-muted">
          © {year} Training Planner
        </p>
      </div>
    </footer>
  );
}

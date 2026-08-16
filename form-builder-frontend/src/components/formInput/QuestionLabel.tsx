import { Stack, Typography } from "@mui/material";

interface QuestionLabelProps {
  label: string;
  required?: boolean;
}

export const QuestionLabel = ({
  label,
  required = false,
}: QuestionLabelProps) => (
  <Stack
    component="span"
    direction="row"
    alignItems="baseline"
    spacing={1}
    flexWrap="wrap"
    useFlexGap
  >
    <Typography component="span" fontWeight={700} color="text.primary">
      {label}
    </Typography>
    <Typography
      component="span"
      variant="caption"
      color={required ? "error.main" : "text.secondary"}
    >
      {required ? "Required" : "Optional"}
    </Typography>
  </Stack>
);

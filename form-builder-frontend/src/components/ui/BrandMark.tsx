import { Box, Stack, Typography } from "@mui/material";

interface BrandMarkProps {
  compact?: boolean;
  inverse?: boolean;
}

export const BrandMark = ({ compact = false, inverse = false }: BrandMarkProps) => (
  <Stack direction="row" spacing={1.25} alignItems="center">
    <Box
      aria-hidden="true"
      sx={{
        position: "relative",
        width: 34,
        height: 34,
        flex: "0 0 auto",
        borderRadius: "10px",
        bgcolor: inverse ? "common.white" : "primary.main",
        boxShadow: "0 1px 2px rgba(23, 32, 51, 0.16)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          insetBlock: 8,
          insetInlineStart: 11,
          width: 2,
          bgcolor: inverse ? "primary.main" : "common.white",
          opacity: 0.78,
        }}
      />
      {[9, 16, 23].map((top) => (
        <Box
          key={top}
          sx={{
            position: "absolute",
            insetBlockStart: top,
            insetInlineStart: 8,
            width: 8,
            height: 8,
            borderRadius: "50%",
            border: "2px solid",
            borderColor: inverse ? "primary.main" : "common.white",
            bgcolor: inverse ? "common.white" : "primary.main",
            transform: "translateY(-50%)",
          }}
        />
      ))}
    </Box>

    {!compact && (
      <Typography
        component="span"
        sx={{
          fontFamily: '"Sora Variable", sans-serif',
          fontSize: "1rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: inverse ? "common.white" : "text.primary",
        }}
      >
        FormFlow
      </Typography>
    )}
  </Stack>
);


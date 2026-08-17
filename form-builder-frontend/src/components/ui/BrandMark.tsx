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
        width: 32,
        height: 32,
        flex: "0 0 auto",
        overflow: "hidden",
        borderRadius: "9px",
        background: inverse
          ? "common.white"
          : "linear-gradient(135deg, #352A77 0%, #1E1650 100%)",
        boxShadow: "0 5px 14px rgba(30, 22, 80, 0.22)",
      }}
    >
      {[
        { top: 9, width: 16, opacity: 0.95 },
        { top: 15, width: 12, opacity: 0.74 },
        { top: 21, width: 8, opacity: 0.54 },
      ].map(({ top, width, opacity }) => (
        <Box
          key={top}
          sx={{
            position: "absolute",
            insetBlockStart: top,
            insetInlineStart: 8,
            width,
            height: 2.5,
            borderRadius: 999,
            bgcolor: inverse ? "primary.main" : "common.white",
            opacity,
          }}
        />
      ))}
    </Box>

    {!compact && (
      <Typography
        component="span"
        sx={{
          fontFamily: '"DM Sans Variable", "Segoe UI", sans-serif',
          fontSize: "1.05rem",
          lineHeight: 1.1,
          fontWeight: 780,
          letterSpacing: "-0.03em",
          color: inverse ? "common.white" : "text.primary",
        }}
      >
        Form
        <Box
          component="span"
          sx={{ color: inverse ? "inherit" : "secondary.main" }}
        >
          Flow
        </Box>
      </Typography>
    )}
  </Stack>
);

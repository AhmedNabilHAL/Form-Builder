import { Box, Card } from "@mui/material";
import type { Control } from "react-hook-form";
import type { Form } from "../../types/Form";
import { FormElementEditor } from "./FormElementEditor";
import { FormElementPreview } from "./FormBuilderPreview";

interface FormElementBuilderProps {
  index: number;
  isActive: boolean;
  onFocus: () => void;
  control: Control<Form>;
}

export const FormElementBuilder = ({
  index,
  isActive,
  onFocus,
  control,
}: FormElementBuilderProps) => {
  return (
    <Card
      sx={{
        position: "relative",
        p: 2,
        mb: 2,
        border: isActive ? "2px solid" : "1px solid",
        borderColor: isActive ? "primary.main" : "divider",
      }}
    >
      {!isActive && (
        <Box
          onClick={onFocus}
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            cursor: "pointer",
          }}
        />
      )}

      <Box sx={{ position: "relative", zIndex: 0 }}>
        {isActive ? (
          <FormElementEditor index={index} control={control} />
        ) : (
          <FormElementPreview index={index} control={control} />
        )}
      </Box>
    </Card>
  );
};
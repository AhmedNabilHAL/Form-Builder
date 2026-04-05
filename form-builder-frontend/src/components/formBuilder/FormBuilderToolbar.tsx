import { Box, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface FormBuilderToolbarProps {
  onAddElement: () => void;
}

export const FormBuilderToolbar = ({ onAddElement }: FormBuilderToolbarProps) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 9999,
      }}
    >
      <Fab color="primary" onClick={onAddElement}>
        <AddIcon />
      </Fab>
    </Box>
  );
};
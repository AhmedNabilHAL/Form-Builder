import { Box, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface FormBuilderToolbarProps {
  onAddElement: () => void;
  /** Distance in pixels from the right edge, used to sit left of the open chat. */
  rightOffset?: number;
  /** Whether the chat dock is open (hides the button on mobile full-screen chat). */
  chatOpen?: boolean;
}

export const FormBuilderToolbar = ({
  onAddElement,
  rightOffset = 32,
  chatOpen = false,
}: FormBuilderToolbarProps) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 32,
        right: `${rightOffset}px`,
        zIndex: (theme) => theme.zIndex.appBar + 3,
        display: { xs: chatOpen ? 'none' : 'block', sm: 'block' },
        transition: 'right 225ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Fab color="primary" onClick={onAddElement}>
        <AddIcon />
      </Fab>
    </Box>
  );
};
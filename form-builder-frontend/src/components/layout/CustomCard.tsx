import { Card, CardContent, Typography, CardActionArea } from '@mui/material';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface CardProps {
  children?: ReactNode | ReactNode[];
  title?: string;
  uri?: string;
}

export const CustomCard = ({ children, title, uri }: CardProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardActionArea onClick={() => uri !== undefined ? navigate(uri) : null}>
        <CardContent>
          {title !== undefined && <Typography variant="h6">{title}</Typography>}
          <Typography variant="body2" color="text.secondary">
            {children}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
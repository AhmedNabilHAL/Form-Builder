import { CustomCard } from './layout/CustomCard';

interface Props {
  form: {
    id: string;
    title: string;
  };
}

export const FormCard = ({ form }: Props) => {

  return (
    <CustomCard
      title={form.title}
      uri={`/forms/${form.id}`}>
      Click to fill out
    </CustomCard>
  );
};
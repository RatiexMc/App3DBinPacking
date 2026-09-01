interface Props {
  title: string;
}

function PageHeader({ title }: Props) {
  return (
    <h1 className="page-title">
      {title}
    </h1>
  );
}

export default PageHeader;
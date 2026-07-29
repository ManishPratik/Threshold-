import { Link } from 'react-router-dom';
import { Heading, Text } from '@shared/ui/Typography';

export function NotFoundPage() {
  return (
    <section aria-labelledby="notfound-heading" style={{ textAlign: 'center', paddingTop: 48 }}>
      <Heading id="notfound-heading" level={1}>
        Not found
      </Heading>
      <Text variant="secondary">This page doesn&apos;t exist.</Text>
      <p style={{ marginTop: 16 }}>
        <Link to="/today">Return to Today</Link>
      </p>
    </section>
  );
}

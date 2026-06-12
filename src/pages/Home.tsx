import React, { useState } from 'react';
import Button from '../components/Button';
import { getHealth } from '../api/client';

const Home: React.FC = () => {
  const [status, setStatus] = useState<string>('');

  const handleHealthCheck = async () => {
    setStatus('Checking backend health...');

    try {
      const result = await getHealth();
      setStatus(`Backend responded: ${result.status ?? 'No status field in response'}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Backend health check failed');
    }
  };

  return (
    <section>
      <div>
        It workssssss
      </div>
      <div>
        <Button label="Click me to Check Backend Health" onClick={handleHealthCheck} type="button" />
      </div>
      {status ? <div>{status}</div> : null}
    </section>
  );
};

export default Home; 
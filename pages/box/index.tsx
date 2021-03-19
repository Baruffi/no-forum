import Head from 'next/head';
import { useEffect, useState } from 'react';
import PageDataService from 'services/page-data-service';
import styles from 'styles/Home.module.css';

export default function Box() {
  const [content, setContent] = useState<string>();

  async function load() {
    const page = await PageDataService.get('box');
    setContent(page.html);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    PageDataService.put('box', content);
  }, [content]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Noforum Sandbox</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <textarea value={content} onChange={(e) => setContent(e.target.value)} />

      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

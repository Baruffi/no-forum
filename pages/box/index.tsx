import Page from 'interfaces/Page';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import PageDataService from 'services/page-data-service';
import styles from 'styles/Home.module.css';

const emptyPage = { id: 'box', html: '' };

export async function getServerSideProps(_: GetServerSidePropsContext) {
  const page = (await PageDataService.get('box')) || emptyPage;

  return {
    props: {
      page,
    },
  };
}

export default function Box({
  page,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [globalContent, setGlobalContent] = useState<string>(page.html);
  const [userContent, setUserContent] = useState<string>('');

  async function post() {
    const response = await fetch('/api/pages/box', {
      headers: [['Content-Type', 'text/html']],
      method: 'POST',
      body: userContent,
    });

    if (response.ok) {
      const page = (await response.json()) as Page;

      if (globalContent != page.html) {
        setGlobalContent(page.html);
      }
    } else {
      console.error('Error posting to serverside api!');
    }
  }

  useEffect(() => {
    post();
  }, [userContent]);

  return (
    <div className={styles.container}>
      <Head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="style-src 'self' 'unsafe-inline'; object-src 'none'; default-src 'self';"
        />
        <meta name="referrer" content="strict-origin" />

        <title>Noforum Sandbox</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <textarea
        value={userContent}
        onChange={(e) => setUserContent(e.target.value)}
      />

      <div className={styles.main}>
        <div dangerouslySetInnerHTML={{ __html: globalContent }} />
      </div>
    </div>
  );
}

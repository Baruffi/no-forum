import Head from 'next/head';
import styles from 'styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to NoForum Sandbox Test!</h1>

        <p className={styles.description}>
          Get started by accessing{' '}
          <code className={styles.code}>/p/[any-path-of-your-choice]</code>
        </p>
      </main>

      <footer className={styles.footer}>
        <div>Noforum Sandbox can be found on:</div>
        <a className={styles.card} href="https://github.com/baruffi">
          Github
        </a>
      </footer>
    </div>
  );
}

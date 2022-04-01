import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {

  const [pagePosts, setPagePosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handlePostsPagination() {
    const newPage = await fetch(nextPage);
    const newPosts = await newPage.json();

    const newResults = newPosts.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(parseISO(post.first_publication_date,), 'dd LLL yyyy'),
        data: {
          title: post.data.slices[0].primary.title,
          subtitle: post.data.slices[0].primary.subtitle,
          author: post.data.slices[0].primary.author,
        }
      }
    });

    setPagePosts([...pagePosts, newResults[0]]);
    setNextPage(newPosts.next_page);
    
  }
  
  return (
    <div className={commonStyles.container}>
      <Head>
        <title>Home | SpaceTraveling</title>
      </Head>
      <main className={styles.homeContent}>
        {pagePosts.map(post => 
          <section
            key={post.uid}
            className={styles.postContainer}>
            <Link href="#">
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
              </a>
            </Link>
            <div>
              <time>
                <span><FiCalendar strokeWidth={2.5} size={20} /></span>
                {post.first_publication_date}
              </time>
              <p>
                <span><FiUser strokeWidth={2.5} size={20} /></span>
                {post.data.author}
              </p>
            </div>
          </section>
        )}
        {nextPage 
          ? <button 
            className={styles.postLoader} 
            onClick={() => handlePostsPagination()}>Carregar mais posts</button> 
          : null}
      </main>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async ({ previewData }) => {
  const prismic = getPrismicClient({ previewData }); 

  const postResponse = await prismic.getByType('posts', {
    fetch: ['post.title', 'post.subtitle', 'post.author'],
    pageSize: 1,
    orderings: ['document.first_publication_date desc']
  });

  const { next_page } = postResponse;

  const results = postResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(parseISO(post.first_publication_date,), 'dd LLL yyyy'),
      data: {
        title: post.data.slices[0].primary.title,
        subtitle: post.data.slices[0].primary.subtitle,
        author: post.data.slices[0]. primary.author,
      }
    }
  });
  
  return {
    props: {
      postsPagination: {
        next_page,
        results
      }
    }
  }
};

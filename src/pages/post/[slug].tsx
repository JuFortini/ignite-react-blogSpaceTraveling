import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import { format, parseISO } from 'date-fns';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {

  const postContent = post.data.content.reduce((acc, currentContent) =>
    [...acc, currentContent],
    []
  );

  const bodyContent = postContent.map(content => RichText.asText(content.body));
  const headingContent = postContent.map(content => content.heading);
  const allContent = bodyContent.concat(headingContent);

  function getReadingTime() {
    const allText = allContent.map(element => element.split(/[\t\s\n]/i));
    const allWords = allText.reduce((acc, currentArray) => 
      acc.concat(currentArray),
      []
    );
    const readingTime = Math.ceil((allWords.length)/200);

    return readingTime
  }

  return (
    <div className={commonStyles.container}>
      <Head>
        <title>{post.data.title} | SpaceTraveling</title>
      </Head>
      <img src={post.data.banner.url} alt="banner" className={styles.banner} />
      <main className={styles.postContainer}>
        <article className={styles.article}>
          <section className={styles.postHeading}>
            <h1>{post.data.title}</h1>
            <div>
              <time>
                <span><FiCalendar strokeWidth={2.5} size={20} /></span>
                {post.first_publication_date}
              </time>
              <p>
                <span><FiUser strokeWidth={2.5} size={20} /></span>
                {post.data.author}
              </p>
              <time>
                <span><FiClock strokeWidth={2.5} size={20} /></span>
                {getReadingTime()} min
              </time>
            </div>
          </section>
          {post.data.content.map(content => 
            <div key={content.heading} className={styles.postContent}>
              <h1>{content.heading}</h1>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body.map(body => body)),
                }}
              />
            </div>
          )}
        </article>
      </main>
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.getByType('posts', {
    pageSize: 5,
    orderings: ['document.first_publication_date desc'],
  });

  const paths = posts.results.map(post => {
    return {
      params: {slug: post.uid}
    }
  });

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({ params, previewData }) => {

  const { slug } = params;

  const prismic = getPrismicClient({ previewData });
  const response = await prismic.getByUID('posts', String(slug));  

  const post = {
    first_publication_date: format(parseISO(response.first_publication_date,), 'dd LLL yyyy'),
    data: {
      title: response.data.slices[0].primary.title,
      banner: {
        url: response.data.slices[0].primary.banner.url,
      },
      author: response.data.slices[0].primary.author,
      content: response.data.slices[0].items.map(item => {
        return {
          heading: item.heading,
          body: item.body,
        }
      })
    }
  }

  return {
    props: {
      post
    },
  }
};

import * as prismic from "@prismicio/client";
import { CreateClientConfig, enableAutoPreviews } from "@prismicio/next";
import sm from "../../sm.json";

type CreateClientProps = CreateClientConfig & prismic.Client;

export const endpoint = sm.apiEndpoint;
export const repositoryName = prismic.getRepositoryName(endpoint);

export function linkResolver(doc: any) {
    switch (doc.type) {
        case 'homepage':
            return '/';
        case 'page':
            return `/${doc.uid}`;
        default:
            return null;
    }
};

export function getPrismicClient(config?: any) {
    const client = prismic.createClient(endpoint, {
        ...config,
    });

    enableAutoPreviews({
        client,
        previewData: config.previewData,
        req: config.req,
    });

    return client;
}


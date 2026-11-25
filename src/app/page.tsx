import { Listing } from "@/components/Listing";
import { getCategories, parseListParams } from "@/lib/data";
import { site } from "@/lib/site";

export default async function Home({ searchParams }: PageProps<"/">) {
  const [sp, categories] = await Promise.all([searchParams, getCategories()]);
  const params = parseListParams(sp);
  return (
    <>
      <section className="hero container">
        <h1>
          作ったものを、
          <br />
          作った人から。
        </h1>
        <p>{site.description}</p>
      </section>
      <Listing params={params} categories={categories} heading="新しく届いた作品" />
    </>
  );
}

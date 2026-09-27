import { useEffect } from "react";
export function usePageSeo(title: string, description: string, path: string) {
  useEffect(() => {
    const oldTitle = document.title;
    document.title = title;
    const url = `https://disqueamizade.com.br${path}`;
    const values: [string, string, string][] = [
      ['meta[name="description"]', "content", description],
      ['meta[property="og:title"]', "content", title],
      ['meta[property="og:description"]', "content", description],
      ['meta[property="og:url"]', "content", url],
      ['meta[name="twitter:title"]', "content", title],
      ['meta[name="twitter:description"]', "content", description],
      ['meta[name="twitter:url"]', "content", url],
      ['link[rel="canonical"]', "href", url],
    ];
    const restores = values.map(([selector, attr, value]) => {
      const element = document.head.querySelector(selector);
      if (!element) return () => {};
      const before = element.getAttribute(attr);
      element.setAttribute(attr, value);
      return () => {
        if (before === null) element.removeAttribute(attr);
        else element.setAttribute(attr, before);
      };
    });
    return () => {
      document.title = oldTitle;
      restores.forEach((f) => f());
    };
  }, [title, description, path]);
}

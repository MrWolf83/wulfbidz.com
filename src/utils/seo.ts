export function updateMetaTags(params?: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}) {
  const defaultTitle = 'WulfBidz - Verified Car Auctions & Live Bidding | wulfbidz.com';
  const defaultDescription = 'WulfBidz is your trusted online car auction marketplace. Buy and sell verified vehicles with live bidding, transparent pricing, and secure transactions.';
  const defaultImage = 'https://wulfbidz.com/1967-Ford-Mustang-Eleanor-Exterior-003-Front-ChromeCars.jpg';
  const defaultUrl = 'https://wulfbidz.com';

  const title = params?.title || defaultTitle;
  const description = params?.description || defaultDescription;
  const image = params?.image || defaultImage;
  const url = params?.url || defaultUrl;
  const type = params?.type || 'website';

  document.title = title;

  updateMetaTag('name', 'description', description);
  updateMetaTag('property', 'og:title', title);
  updateMetaTag('property', 'og:description', description);
  updateMetaTag('property', 'og:image', image);
  updateMetaTag('property', 'og:url', url);
  updateMetaTag('property', 'og:type', type);
  updateMetaTag('name', 'twitter:title', title);
  updateMetaTag('name', 'twitter:description', description);
  updateMetaTag('name', 'twitter:image', image);

  updateLinkTag('canonical', url);
}

export function updateListingMetaTags(params: {
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
  city: string;
  state: string;
  description: string;
  photos: string[];
  listingId: string;
}) {
  const title = `${params.year} ${params.make} ${params.model} - $${params.price.toLocaleString()} | WulfBidz`;
  const description = `${params.year} ${params.make} ${params.model} with ${params.mileage.toLocaleString()} miles located in ${params.city}, ${params.state}. ${params.description.substring(0, 150)}...`;
  const image = params.photos[0] || 'https://wulfbidz.com/1967-Ford-Mustang-Eleanor-Exterior-003-Front-ChromeCars.jpg';
  const url = `https://wulfbidz.com/listing/${params.listingId}`;

  updateMetaTags({
    title,
    description,
    image,
    url,
    type: 'product',
  });

  updateStructuredData({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${params.year} ${params.make} ${params.model}`,
    description: params.description,
    image: params.photos,
    offers: {
      '@type': 'Offer',
      price: params.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: url,
    },
    brand: {
      '@type': 'Brand',
      name: params.make,
    },
    category: 'Vehicle',
    manufacturer: {
      '@type': 'Organization',
      name: params.make,
    },
    vehicleModelDate: params.year,
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: params.mileage,
      unitCode: 'SMI',
    },
    itemCondition: 'https://schema.org/UsedCondition',
  });
}

function updateMetaTag(attr: 'name' | 'property', attrValue: string, content: string) {
  let element = document.querySelector(`meta[${attr}="${attrValue}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, attrValue);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.href = href;
}

function updateStructuredData(data: any) {
  const scriptId = 'listing-structured-data';
  let script = document.getElementById(scriptId);

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
}

export function resetMetaTags() {
  updateMetaTags();

  const listingScript = document.getElementById('listing-structured-data');
  if (listingScript) {
    listingScript.remove();
  }
}

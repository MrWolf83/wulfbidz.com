declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  }
}

export function trackPageView(url: string) {
  if (typeof window.gtag === 'function') {
    window.gtag('config', 'G-XXXXXXXXXX', {
      page_path: url,
    });
  }
}

export function trackListingView(listingId: string, make: string, model: string, year: number) {
  trackEvent('view_item', {
    item_id: listingId,
    item_name: `${year} ${make} ${model}`,
    item_category: 'Vehicle Listing',
  });
}

export function trackBidPlaced(listingId: string, bidAmount: number) {
  trackEvent('bid_placed', {
    listing_id: listingId,
    bid_amount: bidAmount,
    currency: 'USD',
  });
}

export function trackBuyNow(listingId: string, price: number) {
  trackEvent('buy_now', {
    listing_id: listingId,
    price: price,
    currency: 'USD',
  });
}

export function trackListingCreated(listingId: string, make: string, model: string) {
  trackEvent('listing_created', {
    listing_id: listingId,
    make: make,
    model: model,
  });
}

export function trackSearch(searchQuery: string, filters?: Record<string, any>) {
  trackEvent('search', {
    search_term: searchQuery,
    ...filters,
  });
}

export function trackSignUp(method: 'email' | 'social') {
  trackEvent('sign_up', {
    method: method,
  });
}

export function trackLogin(method: 'email' | 'social') {
  trackEvent('login', {
    method: method,
  });
}

export function trackAddToWatchlist(listingId: string) {
  trackEvent('add_to_wishlist', {
    listing_id: listingId,
  });
}

export function trackRemoveFromWatchlist(listingId: string) {
  trackEvent('remove_from_wishlist', {
    listing_id: listingId,
  });
}

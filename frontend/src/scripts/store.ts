export function getBase(): string {
  return document.querySelector('main')?.dataset.base || '/';
}

export interface Restroom {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface Rating {
  id: string;
  restroom_id: string;
  cleanliness: number;
  accessibility: number;
  amenities: number;
  overall: number;
  comment: string;
  created_at: string;
}

export interface RestroomWithRatings extends Restroom {
  avg_cleanliness: number;
  avg_accessibility: number;
  avg_amenities: number;
  avg_overall: number;
  rating_count: number;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getRestrooms(): Restroom[] {
  return JSON.parse(localStorage.getItem('gotg_restrooms') || '[]');
}

function getRatings(): Rating[] {
  return JSON.parse(localStorage.getItem('gotg_ratings') || '[]');
}

function saveRestrooms(restrooms: Restroom[]) {
  localStorage.setItem('gotg_restrooms', JSON.stringify(restrooms));
}

function saveRatings(ratings: Rating[]) {
  localStorage.setItem('gotg_ratings', JSON.stringify(ratings));
}

function computeAverages(restroom: Restroom, ratings: Rating[]): RestroomWithRatings {
  const restroomRatings = ratings.filter(r => r.restroom_id === restroom.id);
  const count = restroomRatings.length;

  if (count === 0) {
    return { ...restroom, avg_cleanliness: 0, avg_accessibility: 0, avg_amenities: 0, avg_overall: 0, rating_count: 0 };
  }

  const sum = (key: keyof Pick<Rating, 'cleanliness' | 'accessibility' | 'amenities' | 'overall'>) =>
    restroomRatings.reduce((acc, r) => acc + r[key], 0) / count;

  return {
    ...restroom,
    avg_cleanliness: sum('cleanliness'),
    avg_accessibility: sum('accessibility'),
    avg_amenities: sum('amenities'),
    avg_overall: sum('overall'),
    rating_count: count,
  };
}

export function listRestrooms(): RestroomWithRatings[] {
  const restrooms = getRestrooms();
  const ratings = getRatings();
  return restrooms.map(r => computeAverages(r, ratings));
}

export function getRestroomById(id: string): RestroomWithRatings | null {
  const restrooms = getRestrooms();
  const restroom = restrooms.find(r => r.id === id);
  if (!restroom) return null;
  return computeAverages(restroom, getRatings());
}

export function addRestroom(data: { name: string; address: string; latitude: number; longitude: number }): Restroom {
  const restrooms = getRestrooms();
  const restroom: Restroom = {
    id: generateId(),
    name: data.name,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
    created_at: new Date().toISOString(),
  };
  restrooms.push(restroom);
  saveRestrooms(restrooms);
  return restroom;
}

export function addRating(data: {
  restroom_id: string;
  cleanliness: number;
  accessibility: number;
  amenities: number;
  overall: number;
  comment: string;
}): Rating {
  const ratings = getRatings();
  const rating: Rating = {
    id: generateId(),
    restroom_id: data.restroom_id,
    cleanliness: data.cleanliness,
    accessibility: data.accessibility,
    amenities: data.amenities,
    overall: data.overall,
    comment: data.comment,
    created_at: new Date().toISOString(),
  };
  ratings.push(rating);
  saveRatings(ratings);
  return rating;
}

export function seedSampleData() {
  if (getRestrooms().length > 0) return;

  const r1 = addRestroom({ name: 'Central Park Restroom', address: '65th St & Central Park West, New York, NY', latitude: 40.7725, longitude: -73.9764 });
  const r2 = addRestroom({ name: 'Grand Central Terminal', address: '89 E 42nd St, New York, NY 10017', latitude: 40.7527, longitude: -73.9772 });
  const r3 = addRestroom({ name: 'Bryant Park Restroom', address: '41 W 40th St, New York, NY 10018', latitude: 40.7536, longitude: -73.9832 });

  addRating({ restroom_id: r1.id, cleanliness: 4, accessibility: 5, amenities: 3, overall: 4, comment: 'Clean and easy to find!' });
  addRating({ restroom_id: r1.id, cleanliness: 5, accessibility: 5, amenities: 4, overall: 5, comment: 'Best public restroom in the park.' });
  addRating({ restroom_id: r2.id, cleanliness: 3, accessibility: 4, amenities: 5, overall: 4, comment: 'Great amenities, slightly crowded.' });
  addRating({ restroom_id: r3.id, cleanliness: 5, accessibility: 5, amenities: 5, overall: 5, comment: 'Spotless! Well maintained.' });
  addRating({ restroom_id: r3.id, cleanliness: 4, accessibility: 4, amenities: 4, overall: 4, comment: 'Very nice for a public restroom.' });
}

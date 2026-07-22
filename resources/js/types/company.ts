export type Company = {
    id: number;
    name: string;
    address: string;
    email: string;
    starting_date: string;
    created_at: string;
    updated_at: string;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    // The "..." ellipsis entry omits `page` entirely rather than setting it null.
    page?: number | null;
    active: boolean;
};

export type PaginationMeta = {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    links: PaginationLink[];
};

export type Paginated<T> = {
    data: T[];
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta: PaginationMeta;
};

export type CompanyStats = {
    total: number;
    added_this_month: number;
    oldest: {
        name: string;
        starting_date: string;
    } | null;
};

export type CompanyFormData = {
    name: string;
    address: string;
    email: string;
    starting_date: string;
};

export type SortDirection = 'asc' | 'desc';

export type CompanySortColumn =
    'id' | 'name' | 'address' | 'email' | 'starting_date' | 'created_at';

export type CompanyListParams = {
    page?: number;
    perPage?: number;
    sort?: CompanySortColumn;
    direction?: SortDirection;
    search?: string;
    createdFrom?: string;
    createdTo?: string;
    startingFrom?: string;
    startingTo?: string;
};

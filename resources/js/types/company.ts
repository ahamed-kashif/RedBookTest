export type Company = {
    id: number;
    name: string;
    address: string;
    email: string;
    starting_date: string;
    created_at: string;
    updated_at: string;
};

export type PaginationMeta = {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
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

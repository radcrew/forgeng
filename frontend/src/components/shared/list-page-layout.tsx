"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { LoadingState } from "@components/common";
import type { SpotIllustration } from "@components/illustrations";
import { Button } from "@components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { PAGE_SIZE_OPTIONS } from "@constants/shared/pagination";
import { EmptyState, PageContainer, PageHeader, type PageMaxWidth } from "./index";

export interface PaginatedData<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

export interface ListPageLayoutProps<
    T,
    TFilter extends string = string,
    TData extends PaginatedData<T> = PaginatedData<T>,
> {
    /** Title and description for the page header */
    header: {
        title: string;
        description: string;
    };

    /** Data fetching hook that takes (filter, page, pageSize) */
    useData: (
        filter: TFilter,
        page: number,
        pageSize: number,
    ) => { data?: TData; isLoading: boolean };

    /** Filter tabs/selector component */
    filterComponent?: React.ReactNode;

    /** Current filter value */
    filter: TFilter;


    /** List component to render items (handle selection inside it) */
    listComponent: React.ComponentType<{ items: T[] }>;

    /** Empty state message */
    emptyMessage?: string;

    /** Spot art shown above the empty state message */
    emptyIllustration?: SpotIllustration;

    /** Loading message */
    loadingMessage?: string;

    /** Max container width (default: "5xl") */
    maxWidth?: PageMaxWidth;
}

export const ListPageLayout = <
    T,
    TFilter extends string = string,
    TData extends PaginatedData<T> = PaginatedData<T>,
>({
    header,
    useData,
    filterComponent,
    filter,
    listComponent: ListComponent,
    emptyMessage = "No items found.",
    emptyIllustration,
    loadingMessage = "Loading…",
    maxWidth = "5xl",
}: ListPageLayoutProps<T, TFilter, TData>) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const { data, isLoading } = useData(filter, page, pageSize);

    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const handlePageSizeChange = (value: string) => {
        setPageSize(Number(value));
        setPage(1);
    };

    return (
        <PageContainer maxWidth={maxWidth}>
            <PageHeader title={header.title} description={header.description} />

            {filterComponent}

            <p className="text-sm text-muted-foreground">
                {isLoading
                    ? "Loading…"
                    : `${total} ${total === 1 ? "item" : "items"}`}
            </p>

            {isLoading ? (
                <LoadingState message={loadingMessage} />
            ) : items.length === 0 ? (
                <EmptyState message={emptyMessage} illustration={emptyIllustration} />
            ) : (
                <ListComponent items={items} />
            )}

            {total > 0 && (
                <div className="flex items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Per page</span>
                        <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="h-8 w-[72px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAGE_SIZE_OPTIONS.map((n) => (
                                    <SelectItem key={n} value={String(n)}>
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || isLoading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || isLoading}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </PageContainer>
    );
};

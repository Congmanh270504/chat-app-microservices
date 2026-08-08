"use client";

import * as React from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/table/Pagination";

export type GroupedSection<TData> = {
    key: string;
    label: string;
    items: TData[];
};

interface GroupedAccordionTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    groups: GroupedSection<TData>[];
    onRowClick?: (rowData: TData) => void;
    activeRowId?: string | null;
    emptyMessage?: string;
    tableHeaderClassName?: string;
    rowClassName?: string;
    activeRowClassName?: string;
    pagination?: {
        total: number;
        page: number;
        limit: number;
    };
}

function GroupedSubTable<TData, TValue>({
    columns,
    data,
    onRowClick,
    activeRowId,
    emptyMessage,
    tableHeaderClassName,
    rowClassName,
    activeRowClassName,
}: {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    onRowClick?: (rowData: TData) => void;
    activeRowId?: string | null;
    emptyMessage: string;
    tableHeaderClassName: string;
    rowClassName: string;
    activeRowClassName: string;
}) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row: any, index) => row.id ?? `${index}`,
    });

    const shouldIgnoreRowClick = (
        event: React.MouseEvent<HTMLTableRowElement>,
    ) => {
        const target = event.target as HTMLElement;
        return !!target.closest(
            "button, [role='checkbox'], input, a, svg, [data-no-row-open='true'], [role='menuitem'], [data-radix-collection-item]",
        );
    };

    return (
        <div className="rounded-md border border-gray-200 bg-white overflow-x-auto">
            <Table>
                <TableHeader className={tableHeaderClassName}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow
                            key={headerGroup.id}
                            className="border-gray-200"
                        >
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    className="font-semibold text-gray-700"
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext(),
                                          )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => {
                            const isActive =
                                (row.original as { id?: string }).id ===
                                activeRowId;
                            return (
                                <TableRow
                                    key={row.id}
                                    className={`${rowClassName} ${
                                        isActive ? activeRowClassName : ""
                                    } ${onRowClick ? "cursor-pointer" : ""}`}
                                    onClick={(event) => {
                                        if (!onRowClick) return;
                                        if (shouldIgnoreRowClick(event)) return;
                                        onRowClick(row.original);
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-20 text-center text-muted-foreground"
                            >
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export function GroupedAccordionTable<TData, TValue>({
    columns,
    groups,
    onRowClick,
    activeRowId,
    emptyMessage = "Không có dữ liệu",
    tableHeaderClassName = "bg-gradient-to-r from-blue-50 to-yellow-50",
    rowClassName = "border-gray-100 odd:bg-white even:bg-blue-50",
    activeRowClassName = "bg-blue-100/70",
    pagination,
}: GroupedAccordionTableProps<TData, TValue>) {
    if (groups.length === 0) {
        return (
            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                {emptyMessage}
            </div>
        );
    }

    const defaultValue = groups[0]?.key ? [groups[0].key] : [];
    const totalPages = pagination
        ? Math.ceil(pagination.total / pagination.limit)
        : 0;

    return (
        <div className="flex flex-col gap-3">
            <Accordion
                type="multiple"
                defaultValue={defaultValue}
                className="w-full"
            >
                {groups.map((group) => (
                    <AccordionItem
                        key={group.key}
                        value={group.key}
                        className="mb-2 overflow-hidden rounded-xl border border-blue-200/70 bg-linear-to-r from-blue-50 via-sky-50 to-indigo-50 px-1 shadow-xs"
                    >
                        <AccordionTrigger className="rounded-lg px-3 py-3 hover:no-underline items-center">
                            <div className="flex w-full items-center justify-between  px-3 py-2 pr-2 backdrop-blur-sm">
                                <span className="text-sm font-semibold bg-gradient-to-r from-blue-500  to-indigo-600 text-transparent bg-clip-text ">
                                    {group.label}
                                </span>
                                <Badge
                                    variant="outline"
                                    className="border-sky-300/80 bg-linear-to-r from-cyan-100 via-sky-100 to-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-sky-900"
                                >
                                    {group.items.length} dòng
                                </Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-3 ">
                            <GroupedSubTable
                                columns={columns}
                                data={group.items}
                                onRowClick={onRowClick}
                                activeRowId={activeRowId}
                                emptyMessage={emptyMessage}
                                tableHeaderClassName={tableHeaderClassName}
                                rowClassName={rowClassName}
                                activeRowClassName={activeRowClassName}
                            />
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {pagination && totalPages > 0 && (
                <div className="px-2 py-2 border-t border-border/60">
                    <Pagination
                        totalPages={totalPages}
                        currentPage={pagination.page}
                        total={pagination.total}
                        limit={pagination.limit}
                    />
                </div>
            )}
        </div>
    );
}

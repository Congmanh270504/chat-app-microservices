/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { Check, Search, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { createGroupAction } from '@/app/chat/chat.actions';
import type { SearchSelectOption } from '@/components/SearchSelectInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Spinner } from '../ui/spinner';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userOptions: SearchSelectOption[];
  onGroupCreated?: () => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  userOptions,
  onGroupCreated,
}: CreateGroupDialogProps) {
  const router = useRouter();
  const [groupTitle, setGroupTitle] = React.useState('');
  const [searchFilter, setSearchFilter] = React.useState('');
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setGroupTitle('');
      setSearchFilter('');
      setSelectedUserIds([]);
      setIsSubmitting(false);
    }
  }, [open]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };



  const filteredUsers = React.useMemo(() => {
    if (!searchFilter.trim()) return userOptions;
    const q = searchFilter.toLowerCase();
    return userOptions.filter((u) => u.searchText?.toLowerCase().includes(q));
  }, [userOptions, searchFilter]);

  const handleCreateGroup = async () => {
    const title = groupTitle.trim();
    if (!title) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedUserIds.length < 2) {
      toast.error('Please select at least 2 other members to create a group');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createGroupAction({
        title,
        participantIds: selectedUserIds,
      });

      if (res.success && res.data?.id) {
        toast.success(`Group "${title}" created successfully!`);
        onOpenChange(false);
        if (onGroupCreated) onGroupCreated();
        router.push(`/chat/${res.data.id}`);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to create group');
      }
    } catch (err: any) {
      console.error('Error creating group:', err);
      toast.error('An error occurred while creating group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 gap-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Users className="size-5" />
            </div>
            <div>
              <DialogTitle>Create new group</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Choose at least 2 participants to start the conversation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Group Name Input */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Group name</Label>
          <Input
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
            placeholder="e.g. Project Team..."
            className="h-10 text-sm rounded-xl"
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        {/* Member Search & List */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">Add members</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 h-9 text-xs rounded-xl bg-muted/40"
              disabled={isSubmitting}
            />
          </div>

          <ScrollArea className="h-48 rounded-xl border bg-card/50">
            <div className="p-1.5 space-y-1">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No users found</div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.value);
                  const fallbackLetter = user.label ? user.label[0].toUpperCase() : 'U';

                  return (
                    <div
                      key={user.value}
                      onClick={() => toggleUser(user.value)}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                          : 'hover:bg-muted/60',
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="size-8 shrink-0">
                          {user.image_url && <AvatarImage src={user.image_url} alt={user.label} />}
                          <AvatarFallback className="text-xs">{fallbackLetter}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate text-foreground">
                            {user.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {user.description}
                          </p>
                        </div>
                      </div>

                      <div
                        className={cn(
                          'size-5 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-muted-foreground/30',
                        )}
                      >
                        {isSelected && <Check className="size-3 stroke-3" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateGroup}
            disabled={!groupTitle.trim() || selectedUserIds.length < 2 || isSubmitting}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Spinner />
                Creating...
              </>
            ) : (
              `Create group`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

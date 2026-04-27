import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Trash2, Star, MessageSquare, MapPin, Briefcase } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import type { KeiKomiPost } from "@shared/schema";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-3 h-3 ${n <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

function PostRow({ post, onApprove, onDelete, approving, deleting }: {
  post: KeiKomiPost;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
  approving: boolean;
  deleting: boolean;
}) {
  return (
    <Card
      className={post.isApproved ? "" : "border-destructive/40 bg-destructive/5"}
      data-testid={`card-admin-keikomi-${post.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {post.isApproved ? (
                <Badge variant="secondary" className="text-xs">公開中</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">審査待ち</Badge>
              )}
              <Badge variant="outline" className="text-xs shrink-0">{post.companyName}</Badge>
              <StarDisplay rating={post.rating} />
              <span className="text-xs text-muted-foreground font-medium">{post.authorName}</span>
              {post.prefecture && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />{post.prefecture}
                </span>
              )}
              {post.workType && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Briefcase className="w-3 h-3" />{post.workType}
                </span>
              )}
            </div>
            <p className="font-semibold text-sm text-foreground">{post.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{post.body}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(post.createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!post.isApproved && (
              <Button
                size="sm"
                onClick={() => onApprove(post.id)}
                disabled={approving}
                data-testid={`button-approve-${post.id}`}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                承認
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(post.id)}
              disabled={deleting}
              data-testid={`button-delete-${post.id}`}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminKeiKomi() {
  const { toast } = useToast();

  const { data: posts, isLoading } = useQuery<KeiKomiPost[]>({
    queryKey: ["/api/admin/kei-komi"],
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/kei-komi/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kei-komi"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kei-komi"] });
      toast({ title: "口コミを承認しました" });
    },
    onError: () => toast({ title: "承認に失敗しました", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/kei-komi/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kei-komi"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kei-komi"] });
      toast({ title: "口コミを削除しました" });
    },
    onError: () => toast({ title: "削除に失敗しました", variant: "destructive" }),
  });

  const pending = posts?.filter(p => !p.isApproved) ?? [];
  const approved = posts?.filter(p => p.isApproved) ?? [];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-primary rounded-md p-6 mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-primary-foreground" />
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">ケイコミ管理</h1>
              <p className="text-sm text-primary-foreground/80 mt-0.5">口コミの審査・承認・削除</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-destructive/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{pending.length}</div>
                <div className="text-xs text-muted-foreground">審査待ち</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{approved.length}</div>
                <div className="text-xs text-muted-foreground">公開中</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-destructive flex items-center gap-1.5 mb-3">
                  <span className="w-2 h-2 rounded-full bg-destructive inline-block" />
                  審査待ち（{pending.length}件）
                </h2>
                <div className="space-y-2">
                  {pending.map(post => (
                    <PostRow
                      key={post.id}
                      post={post}
                      onApprove={(id) => approveMutation.mutate(id)}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      approving={approveMutation.isPending}
                      deleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}
            {approved.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 mb-3">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  公開中（{approved.length}件）
                </h2>
                <div className="space-y-2">
                  {approved.map(post => (
                    <PostRow
                      key={post.id}
                      post={post}
                      onApprove={(id) => approveMutation.mutate(id)}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      approving={approveMutation.isPending}
                      deleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}
            {posts?.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>口コミがまだありません</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

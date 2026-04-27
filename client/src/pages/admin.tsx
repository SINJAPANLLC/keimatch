import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, Users, Trash2, MapPin, CheckCircle, FileText, MessageSquare, Star } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CargoListing, TruckListing, KeiKomiPost } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type SafeUser = {
  id: string;
  username: string;
  companyName: string;
  phone: string;
  email: string;
  userType: string;
  role: string;
  approved: boolean;
  address?: string;
  contactName?: string;
  fax?: string;
  truckCount?: string;
  permitFile?: string;
};

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"cargo" | "trucks" | "users" | "keiKomi">("cargo");

  const { data: cargo, isLoading: cargoLoading } = useQuery<CargoListing[]>({
    queryKey: ["/api/cargo"],
  });

  const { data: trucks, isLoading: trucksLoading } = useQuery<TruckListing[]>({
    queryKey: ["/api/trucks"],
  });

  const { data: adminUsers, isLoading: usersLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const deleteCargo = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cargo/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cargo"] });
      toast({ title: "荷物情報を削除しました" });
    },
  });

  const deleteTruck = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/trucks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks"] });
      toast({ title: "車両情報を削除しました" });
    },
  });

  const approveUser = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/admin/users/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "ユーザーを承認しました" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "ユーザーを削除しました" });
    },
  });

  const { data: keiKomiPosts, isLoading: keiKomiLoading } = useQuery<KeiKomiPost[]>({
    queryKey: ["/api/admin/kei-komi"],
  });

  const approveKeiKomi = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/admin/kei-komi/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kei-komi"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kei-komi"] });
      toast({ title: "口コミを承認しました" });
    },
  });

  const deleteKeiKomi = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/kei-komi/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kei-komi"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kei-komi"] });
      toast({ title: "口コミを削除しました" });
    },
  });

  const pendingKeiKomi = keiKomiPosts?.filter(p => !p.isApproved) ?? [];

  const tabs = [
    { key: "cargo" as const, label: "荷物情報", icon: Package, count: cargo?.length ?? 0 },
    { key: "trucks" as const, label: "車両情報", icon: Truck, count: trucks?.length ?? 0 },
    { key: "users" as const, label: "ユーザー", icon: Users, count: adminUsers?.length ?? 0 },
    { key: "keiKomi" as const, label: "ケイコミ", icon: MessageSquare, count: pendingKeiKomi.length, badge: pendingKeiKomi.length > 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-primary rounded-md p-6 mb-8">
        <h1 className="text-2xl font-bold text-primary-foreground text-shadow-lg" data-testid="text-admin-title">管理画面</h1>
        <p className="text-base text-primary-foreground mt-1 text-shadow">荷物・車両・ユーザーの管理</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {tabs.map((tab) => (
          <Card
            key={tab.key}
            className={`cursor-pointer hover-elevate ${activeTab === tab.key ? "ring-2 ring-primary" : ""}`}
            onClick={() => setActiveTab(tab.key)}
            data-testid={`button-admin-tab-${tab.key}`}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0 relative">
                <tab.icon className="w-5 h-5 text-primary" />
                {"badge" in tab && tab.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center font-bold">{tab.count}</span>
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{tab.count}</div>
                <div className="text-xs text-muted-foreground">{tab.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeTab === "cargo" && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground mb-4">荷物情報一覧</h2>
          {cargoLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
            ))
          ) : cargo?.map((item) => (
            <Card key={item.id} data-testid={`card-admin-cargo-${item.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground text-sm truncate">{item.title}</h3>
                      <Badge variant="secondary" className="text-xs shrink-0">{item.vehicleType}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span>{item.departureArea} → {item.arrivalArea}</span>
                      <span className="ml-2">{item.companyName}</span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteCargo.mutate(item.id)}
                    disabled={deleteCargo.isPending}
                    data-testid={`button-delete-cargo-${item.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "trucks" && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground mb-4">車両情報一覧</h2>
          {trucksLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
            ))
          ) : trucks?.map((item) => (
            <Card key={item.id} data-testid={`card-admin-truck-${item.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground text-sm truncate">{item.title}</h3>
                      <Badge variant="secondary" className="text-xs shrink-0">{item.vehicleType}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span>{item.currentArea} → {item.destinationArea}</span>
                      <span className="ml-2">{item.companyName}</span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteTruck.mutate(item.id)}
                    disabled={deleteTruck.isPending}
                    data-testid={`button-delete-truck-${item.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground mb-4">ユーザー一覧</h2>
          {usersLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
            ))
          ) : adminUsers?.map((u) => (
            <Card key={u.id} data-testid={`card-admin-user-${u.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground text-sm">{u.companyName}</h3>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs shrink-0">
                        {u.role === "admin" ? "管理者" : "一般"}
                      </Badge>
                      {u.role !== "admin" && (
                        <Badge variant={u.approved ? "default" : "destructive"} className="text-xs shrink-0" data-testid={`badge-approved-${u.id}`}>
                          {u.approved ? "承認済" : "未承認"}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {u.email} {u.contactName ? `/ ${u.contactName}` : ""} {u.phone ? `/ ${u.phone}` : ""}
                    </div>
                    {u.truckCount && (
                      <div className="text-xs text-muted-foreground mt-0.5">保有台数: {u.truckCount}</div>
                    )}
                    {u.permitFile && (
                      <a href={u.permitFile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary mt-1" data-testid={`link-permit-${u.id}`}>
                        <FileText className="w-3 h-3" />
                        許可証を確認
                      </a>
                    )}
                  </div>
                  {u.role !== "admin" && (
                    <div className="flex items-center gap-1">
                      {!u.approved && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => approveUser.mutate(u.id)}
                          disabled={approveUser.isPending}
                          data-testid={`button-approve-user-${u.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          承認
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteUser.mutate(u.id)}
                        disabled={deleteUser.isPending}
                        data-testid={`button-delete-user-${u.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {activeTab === "keiKomi" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">ケイコミ口コミ管理</h2>
            <div className="flex gap-2">
              <Badge variant="destructive" className="text-xs">{pendingKeiKomi.length}件 審査待ち</Badge>
              <Badge variant="secondary" className="text-xs">{(keiKomiPosts?.filter(p => p.isApproved) ?? []).length}件 公開中</Badge>
            </div>
          </div>
          {keiKomiLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))
          ) : keiKomiPosts?.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">口コミがまだありません</CardContent></Card>
          ) : (
            <>
              {pendingKeiKomi.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive inline-block" />
                    審査待ち（{pendingKeiKomi.length}件）
                  </h3>
                  <div className="space-y-2 mb-6">
                    {pendingKeiKomi.map((post) => (
                      <Card key={post.id} className="border-destructive/30" data-testid={`card-admin-kei-komi-${post.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Badge variant="outline" className="text-xs shrink-0">{post.companyName}</Badge>
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map(n => (
                                    <Star key={n} className={`w-3 h-3 ${n <= post.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">{post.authorName}</span>
                                {post.prefecture && <span className="text-xs text-muted-foreground">{post.prefecture}</span>}
                              </div>
                              <p className="font-medium text-sm text-foreground">{post.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{post.body}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="sm"
                                onClick={() => approveKeiKomi.mutate(post.id)}
                                disabled={approveKeiKomi.isPending}
                                data-testid={`button-approve-kei-komi-${post.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                承認
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteKeiKomi.mutate(post.id)}
                                disabled={deleteKeiKomi.isPending}
                                data-testid={`button-delete-kei-komi-${post.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {(keiKomiPosts?.filter(p => p.isApproved) ?? []).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    公開中（{(keiKomiPosts?.filter(p => p.isApproved) ?? []).length}件）
                  </h3>
                  <div className="space-y-2">
                    {keiKomiPosts?.filter(p => p.isApproved).map((post) => (
                      <Card key={post.id} data-testid={`card-admin-kei-komi-approved-${post.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Badge variant="secondary" className="text-xs shrink-0">{post.companyName}</Badge>
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map(n => (
                                    <Star key={n} className={`w-3 h-3 ${n <= post.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">{post.authorName}</span>
                              </div>
                              <p className="font-medium text-sm text-foreground">{post.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{post.body}</p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteKeiKomi.mutate(post.id)}
                              disabled={deleteKeiKomi.isPending}
                              data-testid={`button-delete-kei-komi-approved-${post.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

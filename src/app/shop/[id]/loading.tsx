export default function ShopProductLoading() {
  return (
    <div className="min-h-screen bg-primary-50 py-10">
      <div className="container-width space-y-10">
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 animate-pulse rounded-full bg-primary-100" />
          <div className="flex gap-2">
            <div className="h-10 w-32 animate-pulse rounded-full bg-primary-100" />
            <div className="h-10 w-32 animate-pulse rounded-full bg-primary-100" />
          </div>
        </div>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="aspect-[4/3] w-full animate-pulse rounded-3xl bg-primary-100 lg:col-span-7 xl:col-span-8" />
          <div className="space-y-6 lg:col-span-5 xl:col-span-4">
            <div className="h-8 w-3/4 animate-pulse rounded-full bg-primary-100" />
            <div className="h-4 w-full animate-pulse rounded-full bg-primary-100" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-primary-100" />
            <div className="h-48 w-full animate-pulse rounded-2xl bg-primary-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

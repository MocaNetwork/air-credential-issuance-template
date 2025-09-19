import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { env } from "@/lib/env";
import { useSession } from "@/lib/hooks/useSession";
import { getNameFromAccessToken } from "@/lib/utils";

export const DebuggingInfo = () => {
  const { accessToken } = useSession();
  const jwksUrl = `${window.location.origin}/jwks.json`;

  return (
    process.env.NODE_ENV === "development" && (
      <Card className="border border-yellow-400 relative max-w-3xl mx-auto w-full">
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
          DEV
        </div>

        <CardContent className="p-3 space-y-2">
          <div className="space-y-1">
            <Label className="text-xs">Connected User</Label>
            <div className="px-2 py-1 bg-muted rounded text-xs font-mono">
              {accessToken ? getNameFromAccessToken(accessToken) : "Not connected"}
            </div>
          </div>

          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Partner ID</Label>
              <Input
                readOnly
                value={env.NEXT_PUBLIC_PARTNER_ID}
                className="font-mono text-xs h-7"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Issuer DID</Label>
              <Input
                readOnly
                value={env.NEXT_PUBLIC_ISSUER_DID}
                className="font-mono text-xs h-7"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Issuer Program ID</Label>
              <Input
                readOnly
                value={env.NEXT_PUBLIC_ISSUE_PROGRAM_ID}
                className="font-mono text-xs h-7"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">JWKS URL</Label>
              <Input
                readOnly
                value={jwksUrl}
                className="font-mono text-xs h-7"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  );
};

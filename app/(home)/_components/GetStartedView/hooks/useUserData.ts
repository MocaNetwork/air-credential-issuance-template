import { useSession } from "@/lib/hooks/useSession";
import { axiosInstance } from "@/lib/utils/axios";
import { useQuery } from "@tanstack/react-query";

const fetchUserData = async () => {
  const { data } = await axiosInstance.post<{
    response: object;
    jwt: string;
  }>(`/api/user/user-data`);

  return data;
};

export const useUserData = () => {
  const { accessToken } = useSession();

  return useQuery({
    queryKey: ["user-data", accessToken],
    queryFn: fetchUserData,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes - cache the data for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
  });
};

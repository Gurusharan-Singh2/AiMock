import { useMutation,useQueryClient } from "@tanstack/react-query"
import { signup } from "../libs/api"


const useSignin = () => {
 const queryClient=useQueryClient()
  const {mutate:signupMutation, isPending , error}=useMutation({
    mutationFn:signup,
    onSuccess:()=>queryClient.invalidateQueries({queryKey:["authUser"]})
  })
  return {signupMutation,isPending,error}
}

export default useSignin
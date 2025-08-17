# PP HW 4 Report
> - 110062208 林書辰
> - Please include both brief and detailed answers.
> - The report should be based on the UCX code.
> - Describe the code using the 'permalink' from [GitHub repository](https://github.com/NTHU-LSALAB/UCX-lsalab).

## 1. Overview
> In conjunction with the UCP architecture mentioned in the lecture, please read [ucp_hello_world.c](https://github.com/NTHU-LSALAB/UCX-lsalab/blob/ce5c5ee4b70a88ce7c15d2fe8acff2131a44aa4a/examples/ucp_hello_world.c)
1. Identify how UCP Objects (`ucp_context`, `ucp_worker`, `ucp_ep`) interact through the API, including at least the following functions:
    - `ucp_init`
    - `ucp_worker_create`
    - `ucp_ep_create`
2. What is the specific significance of the division of UCP Objects in the program? What important information do they carry?
    - `ucp_context`
    - `ucp_worker`
    - `ucp_ep`
3. Based on the description in HW4, where do you think the following information is loaded/created?
    - `UCX_TLS`
    - TLS selected by UCX
> Answer
1. `ucp_context` will be initialized through[`ucp_init`](https://github.com/NTHU-LSALAB/UCX-lsalab/blob/ce5c5ee4b70a88ce7c15d2fe8acff2131a44aa4a/examples/ucp_hello_world.c#L575) with ucp_para and config.
        
    `ucp_worker` will be initialized through [`ucp_worker_create`](https://github.com/NTHU-LSALAB/UCX-lsalab/blob/ce5c5ee4b70a88ce7c15d2fe8acff2131a44aa4a/examples/ucp_hello_world.c#L587) with ucp_context and work_para
        
    `ucp_ep` will be initialized through [`ucp_ep_create`](https://github.com/NTHU-LSALAB/UCX-lsalab/blob/ce5c5ee4b70a88ce7c15d2fe8acff2131a44aa4a/examples/ucp_hello_world.c#L454), which is inside the [`run_ucx_client`](https://github.com/NTHU-LSALAB/UCX-lsalab/blob/ce5c5ee4b70a88ce7c15d2fe8acff2131a44aa4a/examples/ucp_hello_world.c#L629C20-L629C20) and [`run_ucx_server`](https://github.com/NTHU-LSALAB/UCX-lsalab/blob/ce5c5ee4b70a88ce7c15d2fe8acff2131a44aa4a/examples/ucp_hello_world.c#L633) function, however, we will have to decide the endpoint to be a client or server before calling `run_ucx_client` or `run_ucx_server`. `ucp_ep_create` carry ucp_worker, ep_para as parameter to initialize the `ucp_ep`.

2. The division of UCP Objects is significant for modularity, makes it more flexible and scalable at managing the communication resources. The division is also significant for handling concurrency control.
    - `ucp_context` stores the global configuration settings and resources used by UCX.
    - `ucp_worker` manage the communication resources and keep track of the endpoints under itself.
    - `ucp_ep` stores the information of a remote peer and manage the state of connection.

3. - UCX_TLS should be loaded into config when the function `ucp_config_read` is called. `ucp_config_read` reads the environment variables. [`ucp_config_read`](https://github.com/NTHU-LSALAB/UCX-lsalab/blob/ce5c5ee4b70a88ce7c15d2fe8acff2131a44aa4a/examples/ucp_hello_world.c#L560) is first called in line 560 of ucp_hello_world.c. Finally it loads into `ucp_context` through function `ucp_init()` with config as parameter.

    
    - I think the selected TLS should be created when `ucp_ep_creaete` is called and loaded into `ucp_ep_config` and I think it will be stored inside the variable `key` with struct [`ucp_ep_config_key_t`](https://github.com/NTHU-LSALAB/UCX-lsalab/blob/ce5c5ee4b70a88ce7c15d2fe8acff2131a44aa4a/src/ucp/core/ucp_ep.h#L375).

    


## 2. Implementation

> Describe how you implemented the two special features of HW4.
1. Which files did you modify, and where did you choose to print Line 1 and Line 2?
2. How do the functions in these files call each other? Why is it designed this way?
3. Observe when Line 1 and 2 are printed during the call of which UCP API?
4. Does it match your expectations for questions **1-3**? Why?
5. In implementing the features, we see variables like lanes, tl_rsc, tl_name, tl_device, bitmap, iface, etc., used to store different Layer's protocol information. Please explain what information each of them stores.

> Answers
1. - I modified ucp_worker.c, types.h and parser.c. 
    - I choose to print Line1 and Line2 inside the function `ucs_config_parser_print_opts` using my self-defined flag `UCS_CONFIG_PRINT_TLS`
    - `ucs_config_parser_print_opts` is called by function `ucp_config_print`, which menas I only have to call `ucp_config_print` to print the required output.
    - I call`ucp_config_print` inside the function `ucp_worker_print_used_tls`.
    - Inside `ucp_config_print`, I used `getenv("UCX_TLS")` for Line2. Line2 is passed by the parameter `title` (which is the third parameter in `ucp_config_print`) into `ucp_config_print`.
    ```c++=
    // ucp_worker.c
    ucp_config_print(NULL, stdout, ucs_string_buffer_cstr(&strb), UCS_CONFIG_PRINT_TLS);
    ```
2. [`ucs_config_parser_print_opts`](https://github.com/NTHU-LSALAB/UCX-lsalab/blob/ce5c5ee4b70a88ce7c15d2fe8acff2131a44aa4a/src/ucs/config/parser.c#L1853) is a function inside `parser.c`, which is called by [`ucp_config_print`](https://github.com/NTHU-LSALAB/UCX-lsalab/blob/ce5c5ee4b70a88ce7c15d2fe8acff2131a44aa4a/src/ucp/core/ucp_context.c#L752) inside `ucp_context.c`. By finding the usage of `ucs_config_parser_print_opts`, we can understand that it has been used in many functions. Therefore, we can conclude that the design of `ucp_config_print` is intended to separate it from other functions we are not going to use directly and a better managemnet.


3. Line1 and Line2 are printed during the call of `ucp_ep_create`, I found out that by using ucs_info and tracing back where the function [`ucp_worker_print_used_tls`](https://github.com/NTHU-LSALAB/UCX-lsalab/blob/ce5c5ee4b70a88ce7c15d2fe8acff2131a44aa4a/src/ucp/core/ucp_worker.c#L1764) was called.

4.  - Investigating [`ucp_worker_print_used_tls`](https://github.com/NTHU-LSALAB/UCX-lsalab/blob/ce5c5ee4b70a88ce7c15d2fe8acff2131a44aa4a/src/ucp/core/ucp_worker.c#L1764), where I invoked `ucp_config_print`, we can observe that [`ucp_worker_add_feature_rsc`](https://github.com/NTHU-LSALAB/UCX-lsalab/blob/ce5c5ee4b70a88ce7c15d2fe8acff2131a44aa4a/src/ucp/core/ucp_worker.c#L1844) was called to include the information I am about to output within the `strb`. The parameter of `ucp_worker_add_feature_rsc` includes a key, the type of which is `ucp_ep_config_key_t`.

    - The info such as selected TLS is also inside the parameter `key`, which is a struct of `ucp_ep_config_key_t`, same as the expectation I had in Question 3 of the first section.
    
5. - `lanes` - information of lanes or channels within a network interface.
    - `tl_rsc` - informations like memory buffers, network interfaces, and other resources necessary for communication.
    - `tl_name` - transport name
    - `tl_device` - informations such as the specific communication device or hardware being used for communication.
    - `bitmap` - represents the status or availability of a particular resource or option.
    - `iface` - information about the specific interface being used for communication.

## 3. Optimize System 
1. Below are the current configurations for OpenMPI and UCX in the system. Based on your learning, what methods can you use to optimize single-node performance by setting UCX environment variables?

```
-------------------------------------------------------------------
/opt/modulefiles/openmpi/4.1.5:

module-whatis   {Sets up environment for OpenMPI located in /opt/openmpi}
conflict        mpi
module          load ucx
setenv          OPENMPI_HOME /opt/openmpi
prepend-path    PATH /opt/openmpi/bin
prepend-path    LD_LIBRARY_PATH /opt/openmpi/lib
prepend-path    CPATH /opt/openmpi/include
setenv          UCX_TLS ud_verbs
setenv          UCX_NET_DEVICES ibp3s0:1
-------------------------------------------------------------------
```

> Please use the following commands to test different data sizes for latency and bandwidth, to verify your ideas:
```bash
module load openmpi/4.1.5
mpiucx -n 2 $HOME/UCX-lsalab/test/mpi/osu/pt2pt/standard/osu_latency
mpiucx -n 2 $HOME/UCX-lsalab/test/mpi/osu/pt2pt/standard/osu_bw
```

>Answer

I think we can try to use different Transport Services to optimize single-node performance. Since we know that the default `UD` didn't support RDMA Read/Write, so we can try different transport service for better performance.

![Screenshot 2024-01-06 at 4.05.09 PM](https://hackmd.io/_uploads/rJQpYFL_p.png)

To verify my thought, I tried RC and SM(shared memory) for UCX_TLS, using the command below to change the default UCX_TLS.

```bash=
export UCX_TLS=rc
export UCX_TLS=sm
```

To achieve better performance, it's desirable to have lower latency and higher bandwidth. The plots below demonstrate that using RC (Reliable Connection) results in better bandwidth performance compared to UD (Unreliable Datagram). Additionally, using SM (Shared Memory) leads to even better performance in both latency and bandwidth.

The reason RC performs better, as mentioned above, is its use of RDMA, which achieves higher bandwidth. For SM (Shared Memory), direct in-memory communication eliminates network protocol overheads, resulting in even lower latency and higher bandwidth.

![Screenshot 2024-01-06 at 8.11.26 PM](https://hackmd.io/_uploads/SJR_Q6LOa.png)

![Screenshot 2024-01-06 at 8.11.39 PM](https://hackmd.io/_uploads/r1nKXpId6.png)


### Advanced Challenge: Multi-Node Testing

This challenge involves testing the performance across multiple nodes. You can accomplish this by utilizing the sbatch script provided below. The task includes creating tables and providing explanations based on your findings. Notably, Writing a comprehensive report on this exercise can earn you up to 5 additional points.

- For information on sbatch, refer to the documentation at [Slurm's sbatch page](https://slurm.schedmd.com/sbatch.html).
- To conduct multi-node testing, use the following command:
```
cd ~/UCX-lsalab/test/
sbatch run.batch
```



## 4. Experience & Conclusion
1. What have you learned from this homework?
>Answer

In HW4, I spent a lot of time reading the code of UCX and understanding the functions of various functions. Now, I'm more familiar with how a large project should look and more acquainted with the architecture of UCX. I believe the experience I gained during this assignment has also helped me differentiate between the various transport services.



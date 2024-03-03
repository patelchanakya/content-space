'use client'

import React from 'react'
import { Button } from './ui/button'
import { signIn } from "next-auth/react"

type Props = {
    buttonText: string;
}

const SignInButton = ({ buttonText }: Props) => {
    return (
        <Button variant='ghost' onClick={() => {
            signIn("google")
        }} className="font-bold">
            {buttonText}
        </Button>
    )
}

export default SignInButton
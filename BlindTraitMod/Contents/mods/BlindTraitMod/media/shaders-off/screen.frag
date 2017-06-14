#version 110

uniform sampler2D DIFFUSE;

uniform float TimeOfDay;
uniform float BloomVal;
uniform float bgl_RenderedTextureWidth; //scene sampler width
uniform float bgl_RenderedTextureHeight; //scene sampler height
uniform float timer;
uniform vec2 TextureSize;
uniform float Zoom;

float width = bgl_RenderedTextureWidth;
float height = bgl_RenderedTextureHeight;

const vec3 colHaze = vec3(63.0 / 255.0, 88.0 / 255.0, 155.0 / 255.0);
const vec3 colDawn = vec3(165.0 / 255.0, 127.0 / 255.0, 64.0 / 255.0);
const vec3 colDusk = vec3(215.0 / 255.0, 100.0 / 255.0, 13.0 / 255.0);
const vec4 tint = vec4(1,1,1,1);

const vec3 AvgLumin = vec3(0.4, 0.4, 0.4);
const float permTexUnit = 1.0/256.0;		// Perm texture texel-size
const float permTexUnitHalf = 0.5/256.0;	// Half perm texture texel-size

const float grainamount = 0.0003; //grain amount
bool colored = false; //colored noise?
float coloramount = 1.0;
float grainsize = 1.0; //grain particle size (1.5 - 2.5)
float lumamount = 1.0; //

//a random texture generator, but you can also use a pre-computed perturbation texture
vec4 rnm(in vec2 tc)
{
    float noise =  sin(dot(tc + vec2(timer,timer),vec2(12.9898,78.233))) * 43758.5453;

	float noiseR =  fract(noise)*2.0-1.0;
	float noiseG =  fract(noise*1.2154)*2.0-1.0;
	float noiseB =  fract(noise*1.3453)*2.0-1.0;
	float noiseA =  fract(noise*1.3647)*2.0-1.0;

	return vec4(noiseR,noiseG,noiseB,noiseA);
}
float fade(in float t) {
	return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float pnoise3D(in vec3 p)
{
	vec3 pi = permTexUnit*floor(p)+permTexUnitHalf; // Integer part, scaled so +1 moves permTexUnit texel
	// and offset 1/2 texel to sample texel centers
	vec3 pf = fract(p);     // Fractional part for interpolation

	// Noise contributions from (x=0, y=0), z=0 and z=1
	float perm00 = rnm(pi.xy).a ;
	vec3  grad000 = rnm(vec2(perm00, pi.z)).rgb * 4.0 - 1.0;
	float n000 = dot(grad000, pf);
	vec3  grad001 = rnm(vec2(perm00, pi.z + permTexUnit)).rgb * 4.0 - 1.0;
	float n001 = dot(grad001, pf - vec3(0.0, 0.0, 1.0));

	// Noise contributions from (x=0, y=1), z=0 and z=1
	float perm01 = rnm(pi.xy + vec2(0.0, permTexUnit)).a ;
	vec3  grad010 = rnm(vec2(perm01, pi.z)).rgb * 4.0 - 1.0;
	float n010 = dot(grad010, pf - vec3(0.0, 1.0, 0.0));
	vec3  grad011 = rnm(vec2(perm01, pi.z + permTexUnit)).rgb * 4.0 - 1.0;
	float n011 = dot(grad011, pf - vec3(0.0, 1.0, 1.0));

	// Noise contributions from (x=1, y=0), z=0 and z=1
	float perm10 = rnm(pi.xy + vec2(permTexUnit, 0.0)).a ;
	vec3  grad100 = rnm(vec2(perm10, pi.z)).rgb * 4.0 - 1.0;
	float n100 = dot(grad100, pf - vec3(1.0, 0.0, 0.0));
	vec3  grad101 = rnm(vec2(perm10, pi.z + permTexUnit)).rgb * 4.0 - 1.0;
	float n101 = dot(grad101, pf - vec3(1.0, 0.0, 1.0));

	// Noise contributions from (x=1, y=1), z=0 and z=1
	float perm11 = rnm(pi.xy + vec2(permTexUnit, permTexUnit)).a ;
	vec3  grad110 = rnm(vec2(perm11, pi.z)).rgb * 4.0 - 1.0;
	float n110 = dot(grad110, pf - vec3(1.0, 1.0, 0.0));
	vec3  grad111 = rnm(vec2(perm11, pi.z + permTexUnit)).rgb * 4.0 - 1.0;
	float n111 = dot(grad111, pf - vec3(1.0, 1.0, 1.0));

	// Blend contributions along x
	vec4 n_x = mix(vec4(n000, n001, n010, n011), vec4(n100, n101, n110, n111), fade(pf.x));

	// Blend contributions along y
	vec2 n_xy = mix(n_x.xy, n_x.zw, fade(pf.y));

	// Blend contributions along z
	float n_xyz = mix(n_xy.x, n_xy.y, fade(pf.z));

	// We're done, return the final noise value.
	return n_xyz;
}

//2d coordinate orientation thing
vec2 coordRot(in vec2 tc, in float angle)
{
	float aspect = width/height;
	float rotX = ((tc.x*2.0-1.0)*aspect*cos(angle)) - ((tc.y*2.0-1.0)*sin(angle));
	float rotY = ((tc.y*2.0-1.0)*cos(angle)) + ((tc.x*2.0-1.0)*aspect*sin(angle));
	rotX = ((rotX/aspect)*0.5+0.5);
	rotY = rotY*0.5+0.5;
	return vec2(rotX,rotY);
}

vec3 desaturate(vec3 color, float amount)
{
    vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), color));
    return vec3(mix(color, gray, amount));
}

vec3 contrast(vec3 color, float amount)
{

    color.r = color.r - AvgLumin.r;
    color.g = color.g - AvgLumin.g;
    color.b = color.b - AvgLumin.b;
    color = color * amount;

    color.r = color.r + AvgLumin.r;
    color.g = color.g + AvgLumin.g;
    color.b = color.b + AvgLumin.b;

    return color;
}

// http://www.java-gaming.org/index.php?topic=35123.0
// GL_LINEAR filtering required

vec4 cubic(float v)
{
    vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
    vec4 s = n * n * n;
    float x = s.x;
    float y = s.y - 4.0 * s.x;
    float z = s.z - 4.0 * s.y + 6.0 * s.x;
    float w = 6.0 - x - y - z;
    return vec4(x, y, z, w) * (1.0/6.0);
}

vec4 textureBicubic(sampler2D sampler, vec2 texCoords)
{
//	vec2 texSize = textureSize(sampler, 0);
	vec2 texSize = TextureSize;
	vec2 invTexSize = 1.0 / texSize;

	texCoords = texCoords * texSize - 0.5;

	vec2 fxy = fract(texCoords);
	texCoords -= fxy;

	vec4 xcubic = cubic(fxy.x);
	vec4 ycubic = cubic(fxy.y);

	vec4 c = texCoords.xxyy + vec2(-0.5, +1.5).xyxy;
	
	vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
	vec4 offset = c + vec4(xcubic.yw, ycubic.yw) / s;
	
	offset *= invTexSize.xxyy;
	
	vec4 sample0 = texture2D(sampler, offset.xz);
	vec4 sample1 = texture2D(sampler, offset.yz);
	vec4 sample2 = texture2D(sampler, offset.xw);
	vec4 sample3 = texture2D(sampler, offset.yw);

	float sx = s.x / (s.x + s.y);
	float sy = s.z / (s.z + s.w);

	return mix(
		mix(sample3, sample2, sx),
		mix(sample1, sample0, sx),
		sy);
}

void main()
{
    vec2 UV =  gl_TexCoord[0].st;

    vec3 rotOffset = vec3(1.425,3.892,5.835); //rotation offset values
	vec2 rotCoordsR = coordRot(UV, timer + rotOffset.x);
	vec3 noise = vec3(pnoise3D(vec3(rotCoordsR*vec2(width/grainsize,height/grainsize),0.0)));

    float bloom = 1.0 - abs(0.0 - TimeOfDay);
    bloom = bloom * 0.0;
	 float dawn = 1.0 - (abs(clamp(TimeOfDay, -1.0, 0.0) + 0.5) * 2.0);
	 dawn *= dawn;
	 dawn *= 1.3;
    float dusk = 1.0 - (abs(clamp(TimeOfDay, 0.0, 1.0) - 0.5) * 2.0);
    dusk *= dusk;
    dusk *= 1.3;
    float night = clamp(abs(TimeOfDay), 0.5, 1.0) * 2.0 - 1.0;
    night = night * 0.4;

    vec3 pixel = (Zoom > 0.0) ? textureBicubic(DIFFUSE, gl_TexCoord[0].st).xyz : texture2D(DIFFUSE, UV, 0.0).xyz;
    float intensity = (0.299 * pixel.r) + (0.587 * pixel.g) + (0.114 * pixel.b);

    vec3 Diffuse = texture2D(DIFFUSE, UV, 4.0).xyz * 5.0;
    Diffuse += texture2D(DIFFUSE, UV, 3.0).xyz * 2.5;
    Diffuse += texture2D(DIFFUSE, UV, 2.0).xyz;
    Diffuse += texture2D(DIFFUSE, UV, 1.0).xyz;
    Diffuse /= 6.0;
    Diffuse *= Diffuse*Diffuse;
    Diffuse *= 0.75 * bloom * 0.15 * BloomVal;
    Diffuse *= bloom * 0.75 * pow(intensity, 5.0) + 0.003 * BloomVal;

    Diffuse.yz += colHaze.yz * dawn * 0.125;

    Diffuse += pixel;

    vec3 col = contrast(desaturate(Diffuse, 0.40), 1.3);
    float invintensity = 1.0 - intensity;
    invintensity = invintensity * invintensity;

    col = col+((noise*grainamount) * (invintensity * 5.0));

    col = desaturate(col, 0.99);
    gl_FragColor = vec4(col, 1.0);
 }
